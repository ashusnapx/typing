import { router } from './trpc';
import { authRouter } from './routers/auth';
import { userRouter } from './routers/user';
import { testsRouter } from './routers/tests';
import { leaderboardRouter } from './routers/leaderboard';
import { adminRouter } from './routers/admin';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  tests: testsRouter,
  leaderboard: leaderboardRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
export default appRouter;
