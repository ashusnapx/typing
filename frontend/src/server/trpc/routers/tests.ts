import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { typingTests } from '../../db/schema/typing-tests';
import { keystrokeSummaries } from '../../db/schema/keystroke-summaries';
import { users } from '../../db/schema/users';
import { passages } from '../../db/schema/passages';
import { LeaderboardService } from '../../redis/leaderboard-service';
import { errorEngine } from '../../services/error-engine';
import { typingEngine } from '../../services/typing-engine';
import { analyticsService } from '../../services/analytics';
import { qualificationPredictor } from '../../services/qualification-predictor';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

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
    .mutation(async ({ input, ctx }) => {
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

      typingEngine.createSession(testId, originalContent, input.durationSeconds);

      return { testId, originalContent };
    }),

  submit: protectedProcedure
    .input(
      z.object({
        mode: z.string(),
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
        ? errorEngine.evaluate(input.originalContent, input.typedContent, input.durationSeconds, input.mode)
        : null;

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
              timeTakenSeconds: input.durationSeconds,
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

          const xpEarned = Math.round((sscNetWpm ?? input.netWpm) * 10 * ((sscAccuracy ?? input.accuracy) / 100));
          const [userRecord] = await tx
            .select()
            .from(users)
            .where(eq(users.id, ctx.user.id))
            .limit(1);

          if (userRecord) {
            const newXp = userRecord.xp + xpEarned;
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
            await tx
              .update(users)
              .set({
                xp: newXp,
                level: newLevel,
                updatedAt: createdAt,
              })
              .where(eq(users.id, ctx.user.id));
          }

          return test;
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
        test.netWpm || 0,
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
