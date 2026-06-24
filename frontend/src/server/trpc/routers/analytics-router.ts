import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { analyticsService } from '../../services/analytics';
import { typingTests } from '../../db/schema/typing-tests';
import { errorPatterns } from '../../db/schema/error-patterns';
import { db } from '../../db/client';
import { eq, desc } from 'drizzle-orm';

export const analyticsRouter = router({
  overview: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      const analytics = await analyticsService.getUserAnalytics(ctx.user.id);
      if (!analytics) {
        return {
          totalTests: 0,
          totalTimeSeconds: 0,
          avgWpm: 0,
          avgAccuracy: 0,
          bestWpm: 0,
          bestAccuracy: 0,
        };
      }
      return analytics;
    }),

  history: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      return db
        .select()
        .from(typingTests)
        .where(eq(typingTests.userId, ctx.user.id))
        .orderBy(desc(typingTests.createdAt))
        .offset(input.offset)
        .limit(input.limit);
    }),

  leaderboard: protectedProcedure
    .input(z.object({
      scope: z.string().default('global'),
      period: z.string().default('all_time'),
      limit: z.number().min(1).max(200).default(100),
      state: z.string().optional(),
      district: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      return analyticsService.getLeaderboard({
        ...input,
        userId: ctx.user.id,
      });
    }),

  errorPatterns: protectedProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      return db
        .select()
        .from(errorPatterns)
        .where(eq(errorPatterns.userId, ctx.user.id))
        .orderBy(desc(errorPatterns.frequency))
        .limit(50);
    }),
});
