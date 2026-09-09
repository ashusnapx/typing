import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { typingTests } from '../../db/schema/typing-tests';
import { keystrokeSummaries } from '../../db/schema/keystroke-summaries';
import { users } from '../../db/schema/users';
import { passages } from '../../db/schema/passages';
import { LeaderboardService } from '../../redis/leaderboard-service';
import { errorEngine } from '../../services/error-engine';
import { analyticsService } from '../../services/analytics';
import { qualificationPredictor } from '../../services/qualification-predictor';
import { eq, and, desc, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { TEST_MODES } from '@/types';
import { levelFromXp } from '@/lib/utils';
import { responseCache } from '../../services/response-cache';
import { dashboardCacheKey } from './user';

const keystrokeSchema = z.object({
  key: z.string(),
  timestamp_ms: z.number(),
  duration_ms: z.number(),
  is_error: z.boolean(),
  is_backspace: z.boolean(),
  cursor_position: z.number(),
  expected_char: z.string().nullable().optional(),
});

export const testsRouter = router({
  start: protectedProcedure
    .input(z.object({
      mode: z.string(),
      durationSeconds: z.number(),
      passageId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const testId = crypto.randomUUID();

      let originalContent = '';
      if (input.passageId) {
        const [passage] = await db
          .select()
          .from(passages)
          .where(eq(passages.id, input.passageId))
          .limit(1);
        originalContent = passage?.content ?? '';
      }

      return { testId, originalContent };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        // Narrowed to the modes the database enum actually accepts. As a bare
        // string an unknown mode reached the insert and surfaced as a 500 with
        // the attempt already lost; now it is rejected with a message that says
        // what went wrong.
        mode: z.enum(TEST_MODES),
        durationSeconds: z.number(),
        originalContent: z.string().optional(),
        typedContent: z.string().optional(),
        grossWpm: z.number(),
        netWpm: z.number(),
        accuracy: z.number(),
        totalErrors: z.number(),
        trustScore: z.number(),
        idempotencyKey: z.string(),
        keystrokeEvents: z.array(keystrokeSchema),
        testId: z.string().optional(),
        /** Seconds actually spent typing. Speed is measured against this. */
        timeTakenSeconds: z.number().min(0).max(7200).optional(),
      })
    )
    .output(
      z.object({
        testId: z.string(),
        mode: z.string(),
        grossWpm: z.number(),
        netWpm: z.number(),
        accuracy: z.number(),
        sscNetWpm: z.number().optional(),
        sscAccuracy: z.number().optional(),
        fullMistakes: z.number().optional(),
        halfMistakes: z.number().optional(),
        totalErrors: z.number(),
        trustScore: z.number(),
        xpEarned: z.number(),
        isQualified: z.boolean(),
        keyDepressionCount: z.number().optional(),
        timeTakenSeconds: z.number().optional(),
        omissionErrors: z.number().optional(),
        additionErrors: z.number().optional(),
        substitutionErrors: z.number().optional(),
        wrongWordErrors: z.number().optional(),
        spaceErrors: z.number().optional(),
        backspaceCount: z.number().optional(),
        consistencyScore: z.number().optional(),
        typingRhythmScore: z.number().optional(),
        pauseCount: z.number().optional(),
        sscErrorPercentage: z.number().optional(),
        typedContent: z.string().nullable().optional(),
        originalContent: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [existingTest] = await db
        .select()
        .from(typingTests)
        .where(eq(typingTests.idempotencyKey, input.idempotencyKey))
        .limit(1);

      if (existingTest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Duplicate submission blocked by idempotency key.',
        });
      }

      const testId = crypto.randomUUID();
      const createdAt = new Date();

      const report = input.originalContent && input.typedContent
        ? errorEngine.evaluate(
            input.originalContent,
            input.typedContent,
            input.durationSeconds,
            input.mode,
            input.timeTakenSeconds,
          )
        : null;

      // What the speed was actually divided by, and therefore what belongs in
      // the row — not the allotted window, which is what used to be stored.
      const elapsedSeconds = Math.min(
        input.durationSeconds,
        Math.max(1, input.timeTakenSeconds ?? input.durationSeconds),
      );

      const isQualified = report
        ? errorEngine.isQualifiedFromReport(report, input.mode)
        : input.netWpm >= 35 && input.accuracy >= 95;

      try {
        const result = await db.transaction(async (tx) => {
          const sscNetWpm = report?.sscNetWpm;
          const sscAccuracy = report?.sscAccuracy;

          const backspaceCount = input.keystrokeEvents.filter(e => e.is_backspace).length;
          const pauseCount = 0;

          const [test] = await tx
            .insert(typingTests)
            .values({
              id: testId,
              userId: ctx.user.id,
              mode: input.mode,
              durationSeconds: input.durationSeconds,
              grossWpm: sscNetWpm ?? input.grossWpm,
              netWpm: sscNetWpm ?? input.netWpm,
              accuracy: sscAccuracy ?? input.accuracy,
              totalErrors: report?.totalErrors ?? input.totalErrors,
              fullMistakes: report?.fullMistakes,
              halfMistakes: report?.halfMistakes,
              trustScore: input.trustScore,
              idempotencyKey: input.idempotencyKey,
              createdAt,
              typedContent: input.typedContent || null,
              originalContent: input.originalContent || null,
              keyDepressionCount: report?.keyDepressionCount ?? input.typedContent?.length ?? 0,
              omissionErrors: report?.omissionErrors,
              additionErrors: report?.additionErrors,
              substitutionErrors: report?.substitutionErrors,
              wrongWordErrors: report?.wrongWordErrors,
              spaceErrors: report?.spaceErrors,
              backspaceCount,
              pauseCount,
              consistencyScore: report ? 100 : null,
              typingRhythmScore: report ? 100 : null,
              timeTakenSeconds: elapsedSeconds,
              // Computed since the first version of this mutation and returned
              // to the client, but never written — so every stored attempt had
              // a null verdict and anything reading the row had to re-derive it
              // from a bar that may not be the candidate's.
              isQualified,
              errorPercentage: report?.sscErrorPercentage,
            })
            .returning();

          if (input.keystrokeEvents.length > 0) {
            const keystrokeRecords = input.keystrokeEvents.map((event) => ({
              id: crypto.randomUUID(),
              testId,
              key: event.key,
              timestampMs: event.timestamp_ms,
              durationMs: event.duration_ms,
              isError: event.is_error,
              isBackspace: event.is_backspace,
              cursorPosition: event.cursor_position,
              expectedChar: event.expected_char || '',
              createdAt,
            }));
            await tx.insert(keystrokeSummaries).values(keystrokeRecords);
          }

          /* XP is bounded, and bounded on purpose.
          
             It used to be netWpm * 10 * accuracy, with nothing capping either
             input. A submission reporting an implausibly short elapsed time —
             a paste, a scripted client, a clock that misbehaved — produced a
             speed no human sustains and an award to match: one attempt was
             worth 7,482 XP, which is more than the top rank costs. Since XP
             drives the leaderboard, that is an integrity problem and not just
             a cosmetic one.
          
             The speed used for the award is clamped to something a person can
             actually type, and the award itself to what a perfect run of the
             fastest post is worth. The stored speed is left alone: the report
             should still show what was measured, and the completion rule
             already stops a short burst from counting as a pass. */
          const MAX_HUMAN_WPM = 200;
          const MAX_XP_PER_TEST = 500;
          const scoredWpm = Math.min(
            MAX_HUMAN_WPM,
            Math.max(0, sscNetWpm ?? input.netWpm),
          );
          const scoredAccuracy = Math.min(
            100,
            Math.max(0, sscAccuracy ?? input.accuracy),
          );
          const xpEarned = Math.min(
            MAX_XP_PER_TEST,
            Math.round(scoredWpm * 10 * (scoredAccuracy / 100)),
          );

          // Increment in SQL rather than select-then-set: two attempts landing
          // together would each read the same starting XP and the second write
          // would silently discard the first one's award.
          const [awarded] = await tx
            .update(users)
            .set({
              xp: sql`${users.xp} + ${xpEarned}`,
              updatedAt: createdAt,
            })
            .where(eq(users.id, ctx.user.id))
            .returning({ xp: users.xp });

          if (awarded) {
            await tx
              .update(users)
              .set({ level: levelFromXp(awarded.xp) })
              .where(eq(users.id, ctx.user.id));
          }

          await tx
            .update(typingTests)
            .set({ xpEarned })
            .where(eq(typingTests.id, testId));

          return { ...test, xpEarned };
        });

        const [userData] = await db
          .select({
            state: users.state,
            district: users.district,
          })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        await LeaderboardService.updateScore({
          userId: ctx.user.id,
          wpm: report?.sscNetWpm ?? input.netWpm,
          accuracy: report?.sscAccuracy ?? input.accuracy,
          errors: report?.totalErrors ?? input.totalErrors,
          state: userData?.state || undefined,
          district: userData?.district || undefined,
        });

        await analyticsService.updateUserAnalytics(ctx.user.id, {
          id: testId,
          net_wpm: report?.sscNetWpm ?? input.netWpm,
          accuracy: report?.sscAccuracy ?? input.accuracy,
          consistency_score: 100,
          weak_words: [],
        });

        // The attempt this dashboard is about has just landed, so the cached
        // copy is now the one thing it must not serve.
        await responseCache.invalidate(dashboardCacheKey(ctx.user.id));

        return {
          testId: result.id,
          mode: result.mode,
          grossWpm: result.grossWpm || 0,
          netWpm: result.netWpm || 0,
          accuracy: result.accuracy || 0,
          sscNetWpm: report?.sscNetWpm,
          sscAccuracy: report?.sscAccuracy,
          fullMistakes: report?.fullMistakes,
          halfMistakes: report?.halfMistakes,
          totalErrors: result.totalErrors || 0,
          trustScore: result.trustScore,
          xpEarned: result.xpEarned,
          isQualified,
          keyDepressionCount: report?.keyDepressionCount ?? input.typedContent?.length ?? 0,
          timeTakenSeconds: input.durationSeconds,
          omissionErrors: report?.omissionErrors,
          additionErrors: report?.additionErrors,
          substitutionErrors: report?.substitutionErrors,
          wrongWordErrors: report?.wrongWordErrors,
          spaceErrors: report?.spaceErrors,
          backspaceCount: input.keystrokeEvents.filter(e => e.is_backspace).length,
          consistencyScore: 100,
          typingRhythmScore: 100,
          pauseCount: 0,
          sscErrorPercentage: report?.sscErrorPercentage,
          typedContent: input.typedContent || null,
          originalContent: input.originalContent || null,
        };
      } catch (err) {
        ctx.logger.error(`Error saving test attempt:`, err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process test submission.',
        });
      }
    }),

  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return db
        .select()
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt))
        .offset(input.offset)
        .limit(input.limit);
    }),

  qualification: protectedProcedure
    .input(z.object({ language: z.string().default('english') }))
    .query(async ({ input, ctx }) => {
      const recentTests = await db
        .select()
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt))
        .limit(20);

      const formatted = recentTests.map(t => ({
        net_wpm: t.netWpm,
        accuracy: t.accuracy,
        consistency_score: 100,
      }));

      return {
        chsl: qualificationPredictor.predictChslQualification(formatted, input.language),
        cgl_dest: qualificationPredictor.predictCglDestQualification(formatted),
      };
    }),

  result: protectedProcedure
    .input(z.object({ testId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [test] = await db
        .select()
        .from(typingTests)
        .where(
          and(
            eq(typingTests.id, input.testId),
            eq(typingTests.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!test) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Test not found.',
        });
      }

      const isQualified = errorEngine.isQualified(
        test.grossWpm || 0,
        test.accuracy || 0,
        test.mode,
      );

      return {
        testId: test.id,
        mode: test.mode,
        grossWpm: test.grossWpm || 0,
        netWpm: test.netWpm || 0,
        accuracy: test.accuracy || 0,
        sscNetWpm: (test.netWpm || 0),
        sscAccuracy: (test.accuracy || 0),
        fullMistakes: test.fullMistakes || 0,
        halfMistakes: test.halfMistakes || 0,
        totalErrors: test.totalErrors || 0,
        trustScore: test.trustScore,
        createdAt: test.createdAt,
        isQualified,
        keyDepressionCount: test.keyDepressionCount || 0,
        timeTakenSeconds: test.timeTakenSeconds || 0,
        omissionErrors: test.omissionErrors || 0,
        additionErrors: test.additionErrors || 0,
        substitutionErrors: test.substitutionErrors || 0,
        wrongWordErrors: test.wrongWordErrors || 0,
        spaceErrors: test.spaceErrors || 0,
        backspaceCount: test.backspaceCount || 0,
        pauseCount: test.pauseCount || 0,
        consistencyScore: test.consistencyScore || 100,
        typingRhythmScore: test.typingRhythmScore || 100,
        typedContent: test.typedContent || '',
        originalContent: test.originalContent || '',
      };
    }),

  replay: protectedProcedure
    .input(z.object({ testId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [test] = await db
        .select()
        .from(typingTests)
        .where(
          and(
            eq(typingTests.id, input.testId),
            eq(typingTests.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!test) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Test not found.',
        });
      }

      const events = await db
        .select()
        .from(keystrokeSummaries)
        .where(eq(keystrokeSummaries.testId, input.testId))
        .orderBy(keystrokeSummaries.timestampMs);

      return {
        events: events.map((e) => ({
          key: e.key,
          timestamp_ms: e.timestampMs,
          duration_ms: e.durationMs,
          is_error: e.isError,
          is_backspace: e.isBackspace,
        })),
        original_content: test.originalContent || '',
        typed_content: test.typedContent || '',
        total_duration_ms: (test.durationSeconds || 0) * 1000,
      };
    }),
});
