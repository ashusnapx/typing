import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { typingTests } from '../../db/schema/typing-tests';
import { keystrokeSummaries } from '../../db/schema/keystroke-summaries';
import { users } from '../../db/schema/users';
import { LeaderboardService } from '../../redis/leaderboard-service';
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
  submit: protectedProcedure
    .input(
      z.object({
        mode: z.string(),
        durationSeconds: z.number(),
        grossWpm: z.number(),
        netWpm: z.number(),
        accuracy: z.number(),
        totalErrors: z.number(),
        trustScore: z.number(),
        idempotencyKey: z.string(),
        keystrokeEvents: z.array(keystrokeSchema),
      })
    )
    .output(
      z.object({
        testId: z.string(),
        mode: z.string(),
        grossWpm: z.number(),
        netWpm: z.number(),
        accuracy: z.number(),
        totalErrors: z.number(),
        trustScore: z.number(),
        isQualified: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Validate Idempotency before insertion
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

      // Generate UUID for the test ID
      const testId = crypto.randomUUID(); 
      const createdAt = new Date();

      try {
        // Run database inserts inside a transaction
        const result = await db.transaction(async (tx) => {
          // Insert the test result
          const [test] = await tx
            .insert(typingTests)
            .values({
              id: testId,
              userId: ctx.user.id,
              mode: input.mode,
              durationSeconds: input.durationSeconds,
              grossWpm: input.grossWpm,
              netWpm: input.netWpm,
              accuracy: input.accuracy,
              totalErrors: input.totalErrors,
              trustScore: input.trustScore,
              idempotencyKey: input.idempotencyKey,
              createdAt,
            })
            .returning();

          // Insert the keystroke summaries
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

          // Update user's aggregate best scores and levels/xp
          const xpEarned = Math.round(input.netWpm * 10 * (input.accuracy / 100));
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

        // 2. Queue leaderboard update (Postgres commit succeeded)
        // Fetch user state to write regional rankings
        const [userData] = await db
          .select({
            state: users.state,
            district: users.district,
          })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        // Redis updates are eventual consistent, so it's inside a try/catch in the service itself
        await LeaderboardService.updateScore({
          userId: ctx.user.id,
          wpm: input.netWpm,
          accuracy: input.accuracy,
          errors: input.totalErrors,
          state: userData?.state || undefined,
          district: userData?.district || undefined,
        });

        const isQualified = input.netWpm >= 35 && input.accuracy >= 95;

        return {
          testId: result.id,
          mode: result.mode,
          grossWpm: result.grossWpm || 0,
          netWpm: result.netWpm || 0,
          accuracy: result.accuracy || 0,
          totalErrors: result.totalErrors || 0,
          trustScore: result.trustScore,
          isQualified,
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

      return {
        testId: test.id,
        mode: test.mode,
        grossWpm: test.grossWpm || 0,
        netWpm: test.netWpm || 0,
        accuracy: test.accuracy || 0,
        totalErrors: test.totalErrors || 0,
        trustScore: test.trustScore,
        createdAt: test.createdAt,
        isQualified: (test.netWpm || 0) >= 35 && (test.accuracy || 0) >= 95,
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
        original_content: '',
        typed_content: '',
        total_duration_ms: (test.durationSeconds || 0) * 1000,
      };
    }),
});
