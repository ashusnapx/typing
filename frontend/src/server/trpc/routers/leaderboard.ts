import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { LeaderboardService } from '../../redis/leaderboard-service';
import { db } from '../../db/client';
import { users } from '../../db/schema/users';
import { inArray } from 'drizzle-orm';

export const leaderboardRouter = router({
  getRankings: publicProcedure
    .input(
      z.object({
        scope: z.string(), // e.g. 'global', 'state:Delhi', etc.
        limit: z.number().min(1).max(100).default(100),
      })
    )
    .output(
      z.array(
        z.object({
          rank: z.number(),
          userId: z.string(),
          score: z.number(),
          fullName: z.string(),
          level: z.number(),
          xp: z.number(),
          college: z.string().nullable(),
          bestWpm: z.number().nullable(),
          bestAccuracy: z.number().nullable(),
          totalTestsTaken: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      // 1. Fetch member userIds from Redis ZSET
      const redisTop = await LeaderboardService.getTopRankings(input.scope, input.limit);
      if (redisTop.length === 0) return [];

      const userIds = redisTop.map((item) => item.userId);

      // 2. Query Postgres in bulk to resolve user metadata
      const userMeta = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          level: users.level,
          xp: users.xp,
          college: users.college,
          bestWpm: users.bestWpm,
          bestAccuracy: users.bestAccuracy,
          totalTestsTaken: users.totalTestsTaken,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      // Map profiles for fast O(1) lookup
      const metaMap = new Map(userMeta.map((u) => [u.id, u]));

      // 3. Map Redis positions back to output elements in ordered ranking
      return redisTop.map((item) => {
        const profile = metaMap.get(item.userId);
        return {
          rank: item.rank,
          userId: item.userId,
          score: item.score,
          fullName: profile?.fullName || 'Anonymous Candidate',
          level: profile?.level || 1,
          xp: profile?.xp || 0,
          college: profile?.college || null,
          bestWpm: profile?.bestWpm || null,
          bestAccuracy: profile?.bestAccuracy || null,
          totalTestsTaken: profile?.totalTestsTaken || 0,
        };
      });
    }),
});
