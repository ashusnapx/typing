import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { users } from '../../db/schema/users';
import { typingTests } from '../../db/schema/typing-tests';
import { eq, desc, count, avg, max, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { profileSchema } from '@/lib/schemas';

export const userRouter = router({
  dashboard: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const [aggregate] = await db
        .select({
          totalTests: count(),
          avgWpm: avg(typingTests.netWpm),
          avgAccuracy: avg(typingTests.accuracy),
          bestWpm: max(typingTests.netWpm),
          bestAccuracy: max(typingTests.accuracy),
        })
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id));

      const total_tests = Number(aggregate?.totalTests ?? 0);

      const xpByMode = await db
        .select({
          mode: typingTests.mode,
          totalXp: sql<number>`COALESCE(SUM(${typingTests.xpEarned}), 0)`,
          testCount: count(),
        })
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .groupBy(typingTests.mode);

      const totalTestXp = xpByMode.reduce((s, r) => s + Number(r.totalXp), 0);

      const [userRecord] = await db
        .select({ xp: users.xp })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const totalXp = Number(userRecord?.xp ?? 0);

      const recentTests = await db
        .select()
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt))
        .limit(20);

      const recent_scores = recentTests.map((t) => ({
        id: t.id,
        date: t.createdAt.toISOString(),
        wpm: t.netWpm,
        gross_wpm: t.grossWpm,
        accuracy: t.accuracy,
        mode: t.mode,
        qualified: t.netWpm !== null && t.accuracy !== null ? (t.netWpm >= 35 && t.accuracy >= 95) : false,
        duration: t.durationSeconds,
        total_errors: t.totalErrors,
        backspace_count: 0,
        consistency_score: 100,
        xp_earned: t.xpEarned,
        key_depression_count: t.grossWpm !== null ? t.grossWpm * 5 : 0,
      }));

      const wpms = recentTests.map(t => t.netWpm ?? 0);
      const accs = recentTests.map(t => t.accuracy ?? 0);
      const recent_avg_wpm = wpms.length > 0 ? wpms.reduce((a, b) => a + b, 0) / wpms.length : 0;
      const recent_avg_accuracy = accs.length > 0 ? accs.reduce((a, b) => a + b, 0) / accs.length : 0;

      const chsl_wpm_target = 35;
      const chsl_acc_target = 95;
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

      const wpm_score = Math.min(100, (recent_avg_wpm / chsl_wpm_target) * 100);
      const accuracy_score = Math.min(100, (recent_avg_accuracy / chsl_acc_target) * 100);
      const probability = Math.min(99, Math.max(1, wpm_score * 0.4 + accuracy_score * 0.4 + 20));
      const cgl_probability = Math.min(99, Math.max(1, accuracy_score * 0.7 + 30));

      let recommendation = "Need more practice. Focus on building speed and accuracy fundamentals.";
      if (probability >= 90) {
        recommendation = "You are exam-ready for SSC CHSL! Maintain your current practice routine.";
      } else if (probability >= 70) {
        recommendation = "Close to qualifying! Focus on your weak areas identified in the AI coach feedback.";
      } else if (probability >= 50) {
        recommendation = "Moderate readiness. Increase practice frequency and focus on accuracy.";
      }

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
          tests_analyzed: recentTests.length,
          wpm_series: wpms.slice(0, 10).reverse().map(w => Math.round(w * 10) / 10),
          accuracy_series: accs.slice(0, 10).reverse().map(a => Math.round(a * 10) / 10),
        },
        xpBreakdown: xpByMode.map(r => ({
          source: r.mode,
          xp: Number(r.totalXp),
          tests: Number(r.testCount),
        })),
        lessonXp: Math.max(0, totalXp - totalTestXp),
        recent_scores,
      };
    }),

  profile: protectedProcedure
    .input(z.void())
    .output(
      z.object({
        id: z.string(),
        email: z.string(),
        fullName: z.string(),
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
