import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { typingTests } from '../../db/schema/typing-tests';
import { errorPatterns } from '../../db/schema/error-patterns';
import { passages } from '../../db/schema/passages';
import { eq, desc, sql, and, count, avg, max, sum } from 'drizzle-orm';
import { responseCache } from '../../services/response-cache';

export const dashboardRouter = router({
  stats: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const cacheKey = responseCache.makeCacheKey('dashboard', 'stats', ctx.user.id);
      return responseCache.getOrCompute(cacheKey, 30, async () => {
        const [aggregate] = await db
          .select({
            totalTests: count(),
            avgWpm: avg(typingTests.netWpm),
            avgAccuracy: avg(typingTests.accuracy),
            bestWpm: max(typingTests.netWpm),
            bestAccuracy: max(typingTests.accuracy),
            totalDuration: sum(typingTests.durationSeconds),
          })
          .from(typingTests)
          .where(eq(typingTests.userId, ctx.user.id));

        const [qualified] = await db
          .select({ count: count() })
          .from(typingTests)
          .where(
            and(
              eq(typingTests.userId, ctx.user.id),
              sql`(${typingTests.netWpm} >= 35 AND ${typingTests.accuracy} >= 95)`
            )
          );

        const recentTests = await db
          .select({
            netWpm: typingTests.netWpm,
            accuracy: typingTests.accuracy,
            mode: typingTests.mode,
            createdAt: typingTests.createdAt,
          })
          .from(typingTests)
          .where(eq(typingTests.userId, ctx.user.id))
          .orderBy(desc(typingTests.createdAt))
          .limit(10);

        const totalTests = Number(aggregate?.totalTests ?? 0);

        return {
          totalTests,
          avgWpm: Math.round((Number(aggregate?.avgWpm ?? 0)) * 100) / 100,
          avgAccuracy: Math.round((Number(aggregate?.avgAccuracy ?? 0)) * 100) / 100,
          bestWpm: Math.round((Number(aggregate?.bestWpm ?? 0)) * 100) / 100,
          bestAccuracy: Math.round((Number(aggregate?.bestAccuracy ?? 0)) * 100) / 100,
          qualifiedTests: Number(qualified?.count ?? 0),
          totalDurationSeconds: Number(aggregate?.totalDuration ?? 0),
          recentTests: recentTests.map(t => ({
            id: t.createdAt.toISOString(),
            wpm: t.netWpm,
            accuracy: t.accuracy,
            date: t.createdAt.toISOString(),
            mode: t.mode,
          })),
        };
      });
    }),

  weeklyActivity: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentTests = await db
        .select({
          createdAt: typingTests.createdAt,
          durationSeconds: typingTests.durationSeconds,
        })
        .from(typingTests)
        .where(
          and(
            eq(typingTests.userId, ctx.user.id),
            sql`${typingTests.createdAt} >= ${sevenDaysAgo}`
          )
        );

      const dayMap = new Map<string, { tests: number; duration: number }>();
      for (const t of recentTests) {
        const day = t.createdAt.toISOString().split('T')[0];
        const existing = dayMap.get(day) ?? { tests: 0, duration: 0 };
        existing.tests++;
        existing.duration += t.durationSeconds ?? 0;
        dayMap.set(day, existing);
      }

      return Array.from(dayMap.entries()).map(([date, data]) => ({
        date,
        tests: data.tests,
        durationMinutes: Math.round(data.duration / 60),
      }));
    }),

  errorSummary: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const patterns = await db
        .select()
        .from(errorPatterns)
        .where(eq(errorPatterns.userId, ctx.user.id))
        .orderBy(desc(errorPatterns.frequency))
        .limit(20);

      return patterns.map(p => ({
        patternType: p.patternType,
        patternValue: p.patternValue,
        frequency: p.frequency,
      }));
    }),

  recentPassages: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: passages.id,
          title: passages.title,
          category: passages.category,
          difficulty: passages.difficulty,
          timesUsed: passages.timesUsed,
        })
        .from(passages)
        .where(eq(passages.isActive, true))
        .orderBy(desc(passages.timesUsed))
        .limit(input.limit);
    }),
});
