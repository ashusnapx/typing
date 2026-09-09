import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { users } from '../../db/schema/users';
import { typingTests } from '../../db/schema/typing-tests';
import { eq, ne, and, desc, count, avg, max, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { profileSchema, completeProfileSchema } from '@/lib/schemas';
import { getLessonById } from '@/lib/typing-curriculum';
import { levelFromXp } from '@/lib/utils';
import { responseCache } from '../../services/response-cache';
import { SSC_EXAM_SPECS } from '@/lib/exam-config';
import { assessReadiness } from '@/lib/exam-readiness';
import crypto from 'crypto';

/** Shared with tests.submit, which must drop the entry the moment an attempt
 *  lands — a stale dashboard after finishing a test is the one case where the
 *  cache would be actively wrong rather than merely old. */
export function dashboardCacheKey(userId: string): string {
  return responseCache.makeCacheKey('user', 'dashboard', userId);
}

export const userRouter = router({
  dashboard: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) =>
      responseCache.getOrCompute(dashboardCacheKey(ctx.user.id), 120, async () => {
      // Lessons live in this table too, under mode = 'lesson'. Every
      // exam-facing figure excludes them: a two-minute home-row drill averaged
      // into an SSC readiness number would flatter the candidate into thinking
      // they are faster than they are.
      const isExam = and(
        eq(typingTests.userId, ctx.user.id),
        ne(typingTests.mode, 'lesson')
      );
      const isLesson = and(
        eq(typingTests.userId, ctx.user.id),
        eq(typingTests.mode, 'lesson')
      );

      // Six independent reads — one round trip instead of six.
      const [aggregateRows, xpByMode, userRows, recentTests, lessonRows, activityRows] =
        await Promise.all([
        db
          .select({
            totalTests: count(),
            avgWpm: avg(typingTests.netWpm),
            avgAccuracy: avg(typingTests.accuracy),
            bestWpm: max(typingTests.netWpm),
            bestAccuracy: max(typingTests.accuracy),
          })
          .from(typingTests)
          .where(isExam),
        db
          .select({
            mode: typingTests.mode,
            totalXp: sql<number>`COALESCE(SUM(${typingTests.xpEarned}), 0)`,
            testCount: count(),
          })
          .from(typingTests)
          .where(eq(typingTests.userId, ctx.user.id))
          .groupBy(typingTests.mode),
        db
          .select({ xp: users.xp })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1),
        // Only the columns the page renders — skip the jsonb blobs and full
        // passage text, which dominate the payload.
        db
          .select({
            id: typingTests.id,
            createdAt: typingTests.createdAt,
            netWpm: typingTests.netWpm,
            grossWpm: typingTests.grossWpm,
            accuracy: typingTests.accuracy,
            mode: typingTests.mode,
            durationSeconds: typingTests.durationSeconds,
            totalErrors: typingTests.totalErrors,
            xpEarned: typingTests.xpEarned,
            // Read the verdict and the depression count that were stored with
            // the attempt, rather than guessing them back out of the speed.
            isQualified: typingTests.isQualified,
            errorPercentage: typingTests.errorPercentage,
            fullMistakes: typingTests.fullMistakes,
            halfMistakes: typingTests.halfMistakes,
            keyDepressionCount: typingTests.keyDepressionCount,
            timeTakenSeconds: typingTests.timeTakenSeconds,
            backspaceCount: typingTests.backspaceCount,
          })
          .from(typingTests)
          .where(isExam)
          .orderBy(desc(typingTests.createdAt))
          .limit(20),
        // Lesson progress: how far through the course, and how well.
        db
          .select({
            attempts: count(),
            distinctLessons: sql<number>`COUNT(DISTINCT ${typingTests.lessonId})`,
            clearedLessons: sql<number>`COUNT(DISTINCT ${typingTests.lessonId}) FILTER (WHERE ${typingTests.isQualified})`,
            avgWpm: avg(typingTests.netWpm),
            avgAccuracy: avg(typingTests.accuracy),
          })
          .from(typingTests)
          .where(isLesson),
        // Everything the candidate has done, for time spent and days active —
        // lessons included, because practice time is practice time.
        db
          .select({
            totalSeconds: sql<number>`COALESCE(SUM(${typingTests.durationSeconds}), 0)`,
            // Cast to text in SQL rather than aggregating `date` values: a
            // date[] comes back from the driver as objects whose parsing
            // depends on the type map, and the streak silently read zero.
            // Days are counted in IST because that is the day the candidate
            // lives in — practising at 01:00 in Delhi is 19:30 UTC yesterday,
            // and a streak that breaks on that is simply wrong.
            days: sql<string[]>`COALESCE(ARRAY_AGG(DISTINCT TO_CHAR(${typingTests.createdAt} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')), ARRAY[]::text[])`,
          })
          .from(typingTests)
          .where(eq(typingTests.userId, ctx.user.id)),
      ]);

      const [aggregate] = aggregateRows;
      const total_tests = Number(aggregate?.totalTests ?? 0);

      const totalTestXp = xpByMode.reduce((s, r) => s + Number(r.totalXp), 0);

      const [userRecord] = userRows;
      const totalXp = Number(userRecord?.xp ?? 0);

      const [lessonAgg] = lessonRows;
      const [activity] = activityRows;

      /** Consecutive days ending today or yesterday. Yesterday still counts —
       *  a streak that breaks the moment midnight passes punishes someone who
       *  simply has not practised yet today. */
      const activeDays: string[] = Array.isArray(activity?.days)
        ? (activity.days as string[]).filter(Boolean).sort().reverse()
        : [];

      /** Today in IST, and the days before it, as YYYY-MM-DD. */
      const dayStamp = (offset: number) =>
        new Date(Date.now() - offset * 86400000).toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata',
        });

      let streak = 0;
      if (activeDays.length) {
        const startsToday = activeDays[0] === dayStamp(0);
        const startsYesterday = activeDays[0] === dayStamp(1);
        if (startsToday || startsYesterday) {
          streak = 1;
          for (let i = 1; i < activeDays.length; i++) {
            const expected = new Date(
              new Date(`${activeDays[i - 1]}T00:00:00Z`).getTime() - 86400000
            )
              .toISOString()
              .slice(0, 10);
            if (activeDays[i] === expected) streak++;
            else break;
          }
        }
      }

      const recent_scores = recentTests.map((t) => ({
        id: t.id,
        date: t.createdAt.toISOString(),
        wpm: t.netWpm,
        gross_wpm: t.grossWpm,
        accuracy: t.accuracy,
        mode: t.mode,
        /* The verdict stored with the attempt, judged against the bar for the
           post it was taken for.
        
           This used to be re-derived here as `netWpm >= 35 && accuracy >= 95`,
           which is the LDC/JSA bar applied to every mode. A DEO candidate is
           held to 8,000 key depressions an hour and a 20% error allowance, so
           an attempt that genuinely cleared their skill test was shown on the
           dashboard with a red cross against it. */
        qualified: t.isQualified ?? false,
        duration: t.durationSeconds,
        time_taken_seconds: t.timeTakenSeconds,
        total_errors: t.totalErrors,
        /** Full + half/2 — the figure the result screen and every SSC error
         *  cap are stated in, so the two screens agree. */
        mistakes: (t.fullMistakes ?? 0) + (t.halfMistakes ?? 0) / 2,
        error_percentage: t.errorPercentage,
        backspace_count: t.backspaceCount ?? 0,
        consistency_score: 100,
        xp_earned: t.xpEarned,
        // The count that was stored, not the speed multiplied by five: that is
        // depressions per minute, and it reported 644.55 keystrokes for an
        // attempt of 1,355.
        key_depression_count: t.keyDepressionCount ?? 0,
      }));

      const wpms = recentTests.map(t => t.netWpm ?? 0);
      const accs = recentTests.map(t => t.accuracy ?? 0);
      const recent_avg_wpm = wpms.length > 0 ? wpms.reduce((a, b) => a + b, 0) / wpms.length : 0;
      const recent_avg_accuracy = accs.length > 0 ? accs.reduce((a, b) => a + b, 0) / accs.length : 0;

      /* The bar comes from the same table the exam screen and the result
         screen read, so the dashboard cannot quote a target the test does not
         hold the candidate to. */
      const ldc = SSC_EXAM_SPECS.ssc_chsl_ldc_jsa;
      const chsl_wpm_target = ldc.englishSpeedWpm;
      const chsl_error_cap = ldc.errorAllowanceGeneral;
      const chsl_acc_target = 100 - chsl_error_cap;

      const wpm_gap = Math.max(0, chsl_wpm_target - recent_avg_wpm);
      const acc_gap = Math.max(0, chsl_acc_target - recent_avg_accuracy);

      let wpm_trend = "stable";
      let accuracy_trend = "stable";
      if (wpms.length >= 3) {
        const first = wpms[wpms.length - 1];
        const last = wpms[0];
        if (last > first * 1.05) wpm_trend = "improving";
        else if (last < first * 0.95) wpm_trend = "declining";
      }
      if (accs.length >= 3) {
        const first = accs[accs.length - 1];
        const last = accs[0];
        if (last > first * 1.02) accuracy_trend = "improving";
        else if (last < first * 0.98) accuracy_trend = "declining";
      }

      /* Readiness is conjunctive, because qualifying is. See exam-readiness.ts
         for why the weighted average this replaces was dangerous. */
      const readiness = assessReadiness(
        recentTests.map((t) => ({
          netWpm: t.netWpm,
          errorPercentage: t.errorPercentage,
          accuracy: t.accuracy,
          isQualified: t.isQualified,
        })),
        ldc,
      );

      const probability = readiness.score;
      const cgl_spec = SSC_EXAM_SPECS.ssc_cgl_dest;
      const cgl_probability = assessReadiness(
        recentTests.map((t) => ({
          netWpm: t.netWpm,
          errorPercentage: t.errorPercentage,
          accuracy: t.accuracy,
          isQualified: t.isQualified,
        })),
        cgl_spec,
      ).errorScore;
      const cleared = readiness.cleared;
      const recommendation = readiness.recommendation;

      return {
        overview: {
          total_tests,
          avg_wpm: Number(aggregate?.avgWpm ?? 0),
          avg_accuracy: Number(aggregate?.avgAccuracy ?? 0),
          best_wpm: Number(aggregate?.bestWpm ?? 0),
          best_accuracy: Number(aggregate?.bestAccuracy ?? 0),
        },
        predictions: {
          chsl_qualification_probability: Math.round(probability * 10) / 10,
          cgl_dest_qualification_probability: Math.round(cgl_probability * 10) / 10,
          wpm_trend,
          accuracy_trend,
          consistency_score: 100,
          recommendation,
          recent_avg_wpm: Math.round(recent_avg_wpm * 10) / 10,
          recent_avg_accuracy: Math.round(recent_avg_accuracy * 10) / 10,
          wpm_gap: Math.round(wpm_gap * 10) / 10,
          acc_gap: Math.round(acc_gap * 10) / 10,
          chsl_wpm_target,
          chsl_acc_target,
          chsl_error_cap,
          recent_avg_error: readiness.avgError,
          cleared_recent: cleared,
          blocked_by: readiness.blockedBy,
          tests_analyzed: recentTests.length,
          wpm_series: wpms.slice(0, 10).reverse().map(w => Math.round(w * 10) / 10),
          accuracy_series: accs.slice(0, 10).reverse().map(a => Math.round(a * 10) / 10),
        },
        xpBreakdown: xpByMode.map(r => ({
          source: r.mode,
          xp: Number(r.totalXp),
          tests: Number(r.testCount),
        })),
        // The authoritative XP total. The dashboard used to read this off the
        // auth store, which is only refreshed at sign-in — so XP earned during
        // the session showed a stale figure until the next login.
        totalXp,
        lessonXp: Math.max(0, totalXp - totalTestXp),
        recent_scores,
        // Kept apart from the exam figures on purpose — see `isExam` above.
        lessons: {
          attempts: Number(lessonAgg?.attempts ?? 0),
          practised: Number(lessonAgg?.distinctLessons ?? 0),
          cleared: Number(lessonAgg?.clearedLessons ?? 0),
          avg_wpm: Math.round(Number(lessonAgg?.avgWpm ?? 0) * 10) / 10,
          avg_accuracy: Math.round(Number(lessonAgg?.avgAccuracy ?? 0) * 10) / 10,
        },
        activity: {
          total_seconds: Number(activity?.totalSeconds ?? 0),
          days_active: activeDays.length,
          streak,
        },
      };
      })
    ),

  /**
   * Award the XP for a finished lesson.
   *
   * Lessons used to report their XP through `updateProfile`, which accepts
   * only a name and an email — so the call failed zod validation, threw, and
   * the XP was lost on the server *and* in the client (the optimistic store
   * update lived in the mutation's onSuccess, which never ran).
   *
   * The reward is looked up here rather than sent by the browser: a client
   * that can name its own XP can name any number. The write is a single
   * atomic increment, so two lessons finishing together cannot clobber each
   * other the way a read-then-write does.
   */
  awardLessonXp: protectedProcedure
    .input(
      z.object({
        lessonId: z.string().min(1).max(100),
        qualified: z.boolean(),
        // The figures the drill produced. Clamped rather than trusted — they
        // only ever describe a lesson row, which no exam statistic reads.
        wpm: z.number().min(0).max(400).default(0),
        accuracy: z.number().min(0).max(100).default(0),
        durationSeconds: z.number().min(0).max(7200).default(0),
        totalErrors: z.number().min(0).max(100000).default(0),
        keyDepressions: z.number().min(0).max(1000000).default(0),
      })
    )
    .output(z.object({ xp: z.number(), level: z.number(), awarded: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const lesson = getLessonById(input.lessonId);
      if (!lesson) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Unknown lesson: ${input.lessonId}`,
        });
      }

      // Same split the lesson screen shows: full reward for clearing the bar,
      // a quarter for finishing without clearing it.
      const awarded = input.qualified
        ? lesson.xpReward
        : Math.round(lesson.xpReward * 0.25);

      const now = new Date();

      // The attempt itself, so the dashboard can show that the work happened.
      // Lessons used to leave no trace but a bigger XP number, which is how a
      // candidate could finish a dozen drills and still read "Tests taken 0".
      // mode = 'lesson' keeps it out of every exam-facing figure.
      try {
        await db.insert(typingTests).values({
          id: crypto.randomUUID(),
          userId: ctx.user.id,
          mode: 'lesson',
          lessonId: input.lessonId,
          durationSeconds: Math.round(input.durationSeconds),
          netWpm: input.wpm,
          grossWpm: input.wpm,
          accuracy: input.accuracy,
          totalErrors: Math.round(input.totalErrors),
          keyDepressionCount: Math.round(input.keyDepressions),
          isQualified: input.qualified,
          xpEarned: awarded,
          idempotencyKey: `lesson:${ctx.user.id}:${input.lessonId}:${now.getTime()}`,
          createdAt: now,
        });
      } catch (err) {
        // The XP award is the part that must not be lost. A failed row costs a
        // line of history, not the reward.
        ctx.logger.error('Lesson attempt insert failed', { error: (err as Error)?.message });
      }

      const [updated] = await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${awarded}`,
          updatedAt: now,
        })
        .where(eq(users.id, ctx.user.id))
        .returning({ xp: users.xp });

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }

      // Level follows XP, so it is derived from the row we just wrote rather
      // than from a total the client believed it had.
      const level = levelFromXp(updated.xp);
      await db.update(users).set({ level }).where(eq(users.id, ctx.user.id));

      // The dashboard reads this XP; a cached copy would hide the award for
      // up to two minutes, which is the whole bug being fixed here.
      await responseCache.invalidate(dashboardCacheKey(ctx.user.id));

      return { xp: updated.xp, level, awarded };
    }),

  /**
   * Fill in the fields an older account never supplied.
   *
   * Accounts created before phone and father's name were collected have
   * neither. Rather than lock those candidates out of a row that was perfectly
   * valid when it was written, the app asks on the next sign-in and writes the
   * answers here. Validated with the same schema the form uses, so a client
   * that skips the form cannot write a number the form would have rejected.
   */
  completeProfile: protectedProcedure
    .input(completeProfileSchema)
    .output(
      z.object({
        fullName: z.string(),
        fatherName: z.string().nullable(),
        phone: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [updated] = await db
        .update(users)
        .set({
          fatherName: input.father_name,
          phone: input.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning({
          fullName: users.fullName,
          fatherName: users.fatherName,
          phone: users.phone,
        });

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }

      await responseCache.invalidate(dashboardCacheKey(ctx.user.id));
      return updated;
    }),

  profile: protectedProcedure
    .input(z.void())
    .output(
      z.object({
        id: z.string(),
        email: z.string(),
        fullName: z.string(),
        fatherName: z.string().nullable(),
        phone: z.string().nullable(),
        role: z.string(),
        xp: z.number(),
        level: z.number(),
        state: z.string().nullable(),
        district: z.string().nullable(),
        createdAt: z.date(),
      })
    )
    .query(async ({ ctx }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found.',
        });
      }

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        fatherName: user.fatherName,
        phone: user.phone,
        role: user.role,
        xp: user.xp,
        level: user.level,
        state: user.state,
        district: user.district,
        createdAt: user.createdAt,
      };
    }),

  updateProfile: protectedProcedure
    .input(profileSchema)
    .output(
      z.object({
        id: z.string(),
        email: z.string(),
        fullName: z.string(),
        role: z.string(),
        xp: z.number(),
        level: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [updatedUser] = await db
        .update(users)
        .set({
          fullName: input.full_name,
          email: input.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        xp: updatedUser.xp,
        level: updatedUser.level,
      };
    }),
});
