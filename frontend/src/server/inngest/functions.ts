import { inngest } from './client';
import { db } from '../db/client';
import { users } from '../db/schema/users';
import { sessions } from '../db/schema/sessions';
import { typingTests } from '../db/schema/typing-tests';
import { LeaderboardService } from '../redis/leaderboard-service';
import { createNextMonthPartitions, archiveOldPartitions } from '../db/partitions';
import { eq, lt, desc } from 'drizzle-orm';
import { redis } from '../redis/client';

// 1. Daily Analytics & Cleanup
export const dailyCleanup = inngest.createFunction(
  { id: 'daily-cleanup-job', triggers: [{ cron: '0 0 * * *' }] }, // Runs every day at midnight
  async ({ step }: { step: any }) => {
    // Delete expired sessions from database
    await step.run('cleanup-expired-sessions', async () => {
      const now = new Date();
      await db.delete(sessions).where(lt(sessions.expiresAt, now));
      return { success: true };
    });
  }
);

// 2. Hourly Leaderboard Repair & Reconciliation
export const hourlyLeaderboardRepair = inngest.createFunction(
  { id: 'hourly-leaderboard-repair-job', triggers: [{ cron: '0 * * * *' }] }, // Runs every hour
  async ({ step }: { step: any }) => {
    await step.run('reconcile-redis-rankings', async () => {
      // Re-fill Redis global rankings with best tests from database
      const allUsers = await db
        .select({
          id: users.id,
          state: users.state,
          district: users.district,
        })
        .from(users);

      for (const user of allUsers) {
        const [bestTest] = await db
          .select()
          .from(typingTests)
          .where(eq(typingTests.userId, user.id))
          .orderBy(desc(typingTests.netWpm))
          .limit(1);

        if (bestTest) {
          // Re-insert into ZSET to ensure consistency
          await LeaderboardService.updateScore({
            userId: user.id,
            wpm: bestTest.netWpm || 0,
            accuracy: bestTest.accuracy || 0,
            errors: bestTest.totalErrors || 0,
            state: user.state || undefined,
            district: user.district || undefined,
          });
        }
      }
      return { success: true, count: allUsers.length };
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
