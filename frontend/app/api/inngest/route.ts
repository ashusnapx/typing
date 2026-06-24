import { serve } from 'inngest/next';
import { inngest } from '@/src/server/inngest/client';
import {
  dailyCleanup,
  hourlyLeaderboardRepair,
  monthlyPartitionManagement,
} from '@/src/server/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    dailyCleanup,
    hourlyLeaderboardRepair,
    monthlyPartitionManagement,
  ],
});
