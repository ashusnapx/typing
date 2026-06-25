import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import { logStorage } from '../observability/logger';
import { traceSpan } from '../observability/tracing';
import { redis } from '../redis/client';
import crypto from 'crypto';

const t = initTRPC.context<Context>().create();

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_AUTHED = 100;
const RATE_LIMIT_ANON = 20;

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

async function checkRateLimit(ctx: Context): Promise<void> {
  const key = ctx.user?.id
    ? `ratelimit:user:${ctx.user.id}`
    : `ratelimit:ip:${hashIp(ctx.clientIp || 'unknown')}`;
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    const limit = ctx.user?.id ? RATE_LIMIT_AUTHED : RATE_LIMIT_ANON;
    if (current > limit) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. ${limit} requests per ${RATE_LIMIT_WINDOW}s.`,
      });
    }
  } catch (err) {
    if (err instanceof TRPCError) throw err;
  }
}

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

// Middleware: Rate limiting
const rateLimitMiddleware = t.middleware(async ({ next, ctx }) => {
  await checkRateLimit(ctx);
  return next();
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
export const publicProcedure = t.procedure.use(loggingMiddleware).use(rateLimitMiddleware);
export const protectedProcedure = t.procedure.use(loggingMiddleware).use(rateLimitMiddleware).use(isAuthed);
export const middleware = t.middleware;
