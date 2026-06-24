import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { typingTests } from '../../db/schema/typing-tests';
import { userAnalytics } from '../../db/schema/user-analytics';
import { errorPatterns } from '../../db/schema/error-patterns';
import { passages } from '../../db/schema/passages';
import { eq, desc, sql } from 'drizzle-orm';

export const dashboardRouter = router({
  stats: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const allTests = await db
        .select({
          netWpm: typingTests.netWpm,
          accuracy: typingTests.accuracy,
          grossWpm: typingTests.grossWpm,
          mode: typingTests.mode,
          durationSeconds: typingTests.durationSeconds,
          createdAt: typingTests.createdAt,
        })
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt));

      const totalTests = allTests.length;
      const avgWpm = totalTests > 0
        ? allTests.reduce((s, t) => s + (t.netWpm ?? 0), 0) / totalTests
        : 0;
      const avgAccuracy = totalTests > 0
        ? allTests.reduce((s, t) => s + (t.accuracy ?? 0), 0) / totalTests
        : 0;
      const bestWpm = totalTests > 0
        ? Math.max(...allTests.map(t => t.netWpm ?? 0))
        : 0;
      const bestAccuracy = totalTests > 0
        ? Math.max(...allTests.map(t => t.accuracy ?? 0))
        : 0;

      const qualifiedTests = allTests.filter(
        t => (t.netWpm ?? 0) >= 35 && (t.accuracy ?? 0) >= 95,
      ).length;

      const totalDuration = allTests.reduce((s, t) => s + (t.durationSeconds ?? 0), 0);

      return {
        totalTests,
        avgWpm: Math.round(avgWpm * 100) / 100,
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        bestWpm: Math.round(bestWpm * 100) / 100,
        bestAccuracy: Math.round(bestAccuracy * 100) / 100,
        qualifiedTests,
        totalDurationSeconds: totalDuration,
        recentTests: allTests.slice(0, 10).map(t => ({
          id: t.createdAt.toISOString(),
          wpm: t.netWpm,
          accuracy: t.accuracy,
          date: t.createdAt.toISOString(),
          mode: t.mode,
        })),
      };
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
          eq(typingTests.userId, ctx.user.id) &&
          sql`${typingTests.createdAt} >= ${sevenDaysAgo}`
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
