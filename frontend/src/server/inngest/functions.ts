import { inngest } from './client';
import { db, getDb } from '../db/client';
import { users } from '../db/schema/users';
import { sessions } from '../db/schema/sessions';
import { typingTests } from '../db/schema/typing-tests';
import { LeaderboardService } from '../redis/leaderboard-service';
import { createNextMonthPartitions, archiveOldPartitions } from '../db/partitions';
import { eq, lt, sql } from 'drizzle-orm';
import { redis } from '../redis/client';

const BATCH_SIZE = 500;

// 1. Daily Analytics & Cleanup
export const dailyCleanup = inngest.createFunction(
  { id: 'daily-cleanup-job', triggers: [{ cron: '0 0 * * *' }] },
  async ({ step }: { step: any }) => {
    await step.run('cleanup-expired-sessions', async () => {
      const now = new Date();
      await db.delete(sessions).where(lt(sessions.expiresAt, now));
      return { success: true };
    });
  }
);

// 2. Hourly Leaderboard Repair & Reconciliation
export const hourlyLeaderboardRepair = inngest.createFunction(
  { id: 'hourly-leaderboard-repair-job', triggers: [{ cron: '0 * * * *' }] },
  async ({ step }: { step: any }) => {
    await step.run('reconcile-redis-rankings', async () => {
      let offset = 0;
      let total = 0;

      while (true) {
        const batch = await getDb()
          .select({
            id: users.id,
            state: users.state,
            district: users.district,
          })
          .from(users)
          .limit(BATCH_SIZE)
          .offset(offset);

        if (batch.length === 0) break;
        offset += batch.length;

        const userIds = batch.map(u => u.id);

        // Single batch query: best test per user using DISTINCT ON
        const bestTests = await getDb().execute(
          sql`
            SELECT DISTINCT ON (tt.user_id)
              tt.user_id, tt.net_wpm, tt.accuracy, tt.total_errors
            FROM typing_tests tt
            WHERE tt.user_id = ANY(${userIds})
            ORDER BY tt.user_id, tt.net_wpm DESC
          `
        );

        const rows = bestTests.rows as Array<{
          user_id: string; net_wpm: number; accuracy: number; total_errors: number;
        }>;
        const bestMap = new Map(rows.map(r => [r.user_id, r]));

        for (const user of batch) {
          const best = bestMap.get(user.id);
          if (best) {
            await LeaderboardService.updateScore({
              userId: user.id,
              wpm: best.net_wpm || 0,
              accuracy: best.accuracy || 0,
              errors: best.total_errors || 0,
              state: user.state || undefined,
              district: user.district || undefined,
            });
          }
        }

        total += batch.length;
      }

      return { success: true, count: total };
    });
  }
);

// 3. Monthly Database Partition Creation & Archiving
export const monthlyPartitionManagement = inngest.createFunction(
  { id: 'monthly-partition-management-job', triggers: [{ cron: '0 0 1 * *' }] }, // Runs on the first day of every month at midnight
  async ({ step }: { step: any }) => {
    // Create new partitions
    await step.run('create-new-partitions', async () => {
      await createNextMonthPartitions();
      return { success: true };
    });

    // Detach and archive partitions older than 3 months
    await step.run('archive-old-partitions', async () => {
      await archiveOldPartitions();
      return { success: true };
    });
  }
);
