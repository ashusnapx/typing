import { redis } from './client';

export class LeaderboardService {
  /**
   * Generates a deterministic composite sorting score for the leaderboard.
   * Collisions are minimized by ordering WPM -> Accuracy -> Errors.
   */
  static calculateCompositeScore(wpm: number, accuracy: number, errors: number): number {
    return Math.round(wpm * 100000 + accuracy * 100 + (100 - errors));
  }

  /**
   * Schedules or commits score updates to the Redis ZSET indices.
   * This is called AFTER successful PostgreSQL transactions.
   */
  static async updateScore(params: {
    userId: string;
    wpm: number;
    accuracy: number;
    errors: number;
    state?: string;
    district?: string;
    college?: string;
  }): Promise<void> {
    const score = this.calculateCompositeScore(params.wpm, params.accuracy, params.errors);

    try {
      const pipeline = redis.pipeline();

      // Add to global leaderboard
      pipeline.zadd('leaderboard:global', score, params.userId);

      // Add to state leaderboard if present
      if (params.state) {
        pipeline.zadd(`leaderboard:state:${params.state}`, score, params.userId);
      }

      // Add to district leaderboard if present
      if (params.district) {
        pipeline.zadd(`leaderboard:district:${params.district}`, score, params.userId);
      }

      // Add to college leaderboard if present
      if (params.college) {
        pipeline.zadd(`leaderboard:college:${params.college}`, score, params.userId);
      }

      await pipeline.exec();
    } catch (err) {
      // Eventual consistency contract: Redis outages do not fail user submissions.
      // We log the failure. Inngest hourly jobs will run leaderboard reconciliation.
      console.error(`Leaderboard update failed for user ${params.userId} (Postgres transaction succeeded). Deferring to hourly reconciliation. Error:`, err);
    }
  }

  /**
   * Fetch rankings efficiently using ZREVRANGE in O(log N + M) complexity.
   */
  static async getTopRankings(scope: string, limit = 100): Promise<{ userId: string; rank: number; score: number }[]> {
    const key = `leaderboard:${scope}`;
    try {
      // Retrieve scores and members
      const members = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
      const results: { userId: string; rank: number; score: number }[] = [];
      
      for (let i = 0; i < members.length; i += 2) {
        const userId = members[i];
        const score = parseFloat(members[i + 1]);
        results.push({
          userId,
          rank: Math.floor(i / 2) + 1,
          score,
        });
      }
      return results;
    } catch (err) {
      console.error(`Failed to fetch leaderboard for key ${key}:`, err);
      return [];
    }
  }

  /**
   * Fetch specific user's rank.
   */
  static async getUserRank(scope: string, userId: string): Promise<{ rank: number; score: number } | null> {
    const key = `leaderboard:${scope}`;
    try {
      const [rank, score] = await Promise.all([
        redis.zrevrank(key, userId),
        redis.zscore(key, userId),
      ]);
      if (rank === null || score === null) return null;
      return {
        rank: rank + 1,
        score: parseFloat(score),
      };
    } catch (err) {
      console.error(`Failed to fetch user rank for ${userId} in ${key}:`, err);
      return null;
    }
  }
}
export default LeaderboardService;
