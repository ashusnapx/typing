import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { testsRouter } from './routers/tests';
import { leaderboardRouter } from './routers/leaderboard';
import { adminRouter } from './routers/admin';
import { passagesRouter } from './routers/passages';
import { analyticsRouter } from './routers/analytics-router';
import { aiCoachRouter } from './routers/ai-coach-router';
import { dashboardRouter } from './routers/dashboard';
import { subscriptionRouter } from './routers/subscription';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  tests: testsRouter,
  leaderboard: leaderboardRouter,
  admin: adminRouter,
  passages: passagesRouter,
  analytics: analyticsRouter,
  aiCoach: aiCoachRouter,
  dashboard: dashboardRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
export default appRouter;
