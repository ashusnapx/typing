import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { sessions } from '../db/schema/sessions';
import { users } from '../db/schema/users';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '../observability/logger';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export async function createContext(opts: FetchCreateContextFnOptions) {
  const req = opts.req;
  
  // Extract or generate Correlation ID
  const requestId = req.headers.get('X-Request-ID') || `req_${Math.random().toString(36).substring(2, 15)}`;

  let session: any = null;
  let user: UserSession | null = null;

  // Extract auth token
  const authHeader = req.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    // Check cookies
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    try {
      // Lookup active session in PostgreSQL
      const [dbSession] = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.token, token),
            gt(sessions.expiresAt, new Date())
          )
        )
        .limit(1);

      if (dbSession) {
        // Fetch user info
        const [dbUser] = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, dbSession.userId))
          .limit(1);

        if (dbUser) {
          session = dbSession;
          user = dbUser;
        }
      }
    } catch (err) {
      logger.error('Session lookup failed during createContext:', err);
    }
  }

  return {
    db,
    redis,
    logger,
    requestId,
    session,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
