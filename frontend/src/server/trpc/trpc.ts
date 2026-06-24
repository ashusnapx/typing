import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import { logStorage } from '../observability/logger';
import { traceSpan } from '../observability/tracing';

const t = initTRPC.context<Context>().create();

// Middleware: Logging & Performance Timing
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  return logStorage.run(
    {
      requestId: ctx.requestId,
      userId: ctx.user?.id,
      route: path,
    },
    async () => {
      return traceSpan(path, 'API', { path, type, userId: ctx.user?.id }, async () => {
        return next();
      });
    }
  );
});

// Middleware: Protected procedurals
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication session expired or invalid.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(isAuthed);
export const middleware = t.middleware;
