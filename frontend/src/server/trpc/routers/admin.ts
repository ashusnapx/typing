import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../../db/client';
import { users } from '../../db/schema/users';
import { typingTests } from '../../db/schema/typing-tests';
import { LeaderboardService } from '../../redis/leaderboard-service';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { redis } from '../../redis/client';

export const adminRouter = router({
  recomputeLeaderboard: protectedProcedure
    .input(z.void())
    .output(z.object({ success: z.boolean(), totalCount: z.number() }))
    .mutation(async ({ ctx }) => {
      // Enforce admin privileges
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can trigger leaderboard recomputations.',
        });
      }

      try {
        // Fetch all users
        const allUsers = await db
          .select({
            id: users.id,
            state: users.state,
            district: users.district,
          })
          .from(users);

        let recomputedCount = 0;

        // Clear existing ZSET entries to reconstruct
        await redis.del('leaderboard:global');

        for (const user of allUsers) {
          // Get best test result for the user
          const [bestTest] = await db
            .select()
            .from(typingTests)
            .where(eq(typingTests.userId, user.id))
            .orderBy(desc(typingTests.netWpm))
            .limit(1);

          if (bestTest) {
            await LeaderboardService.updateScore({
              userId: user.id,
              wpm: bestTest.netWpm || 0,
              accuracy: bestTest.accuracy || 0,
              errors: bestTest.totalErrors || 0,
              state: user.state || undefined,
              district: user.district || undefined,
            });
            recomputedCount++;
          }
        }

        return { success: true, totalCount: recomputedCount };
      } catch (err) {
        ctx.logger.error('Failed to recompute leaderboards:', err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Leaderboard recomputation failed.',
        });
      }
    }),
});
