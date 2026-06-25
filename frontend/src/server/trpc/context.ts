import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { users } from '../db/schema/users';
import { eq } from 'drizzle-orm';
import { logger } from '../observability/logger';
import * as jose from 'jose';

const USER_CACHE_TTL = 60;

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

let jwks: jose.JWTVerifyGetKey | null = null;
let jwksExpiry = 0;

async function getJwks(): Promise<jose.JWTVerifyGetKey> {
  if (jwks && Date.now() < jwksExpiry) return jwks;
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');
  if (!projectRef) throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
  const url = `https://${projectRef}.supabase.co/auth/v1/.well-known/jwks.json`;
  jwks = jose.createRemoteJWKSet(new URL(url));
  jwksExpiry = Date.now() + 3600000;
  return jwks;
}

async function verifyJwt(token: string): Promise<jose.JWTPayload | null> {
  try {
    const key = await getJwks();
    const { payload } = await jose.jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);

  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
  if (match) return match[1];

  return null;
}

function getRequestId(req: Request): string {
  return req.headers.get('X-Request-ID') || `req_${Math.random().toString(36).substring(2, 15)}`;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

export async function createContext(opts: FetchCreateContextFnOptions) {
  const req = opts.req;
  const requestId = getRequestId(req);

  let session: any = null;
  let user: UserSession | null = null;

  const token = extractToken(req);

  if (token) {
    try {
      const payload = await verifyJwt(token);
      const decodedSub = (payload?.sub ?? null) as string | null;
      const decodedEmail = (payload?.email ?? null) as string | null;

      if (!decodedSub || !decodedEmail) {
        logger.warn('JWT missing sub or email claim', { hasSub: !!decodedSub, hasEmail: !!decodedEmail });
      } else {
        const cacheKey = `user:id:${decodedSub}`;
        let cached: UserSession | null = null;
        try {
          const raw = await redis.get(cacheKey);
          if (raw) cached = JSON.parse(raw);
        } catch {}

        if (cached) {
          user = cached;
          session = { userId: cached.id };
        } else {
          const [existingUser] = await db
            .select({
              id: users.id,
              email: users.email,
              fullName: users.fullName,
              role: users.role,
            })
            .from(users)
            .where(eq(users.id, decodedSub))
            .limit(1);

          if (existingUser) {
            user = {
              id: existingUser.id,
              email: existingUser.email,
              fullName: existingUser.fullName,
              role: existingUser.role,
            };
            session = { userId: existingUser.id };
            try { await redis.setex(cacheKey, USER_CACHE_TTL, JSON.stringify(user)); } catch {}
          } else {
            const decodedMeta = (payload as Record<string, any>)?.user_metadata || {};
            const displayName = String(decodedMeta.full_name || decodedMeta.name || decodedEmail.split('@')[0] || 'User');
            const now = new Date();
            try {
              const [newUser] = await db
                .insert(users)
                .values({
                  id: decodedSub,
                  email: decodedEmail,
                  fullName: displayName,
                  role: 'student',
                  isVerified: true,
                  isActive: true,
                  xp: 0,
                  level: 1,
                  streakDays: 0,
                  totalTestsTaken: 0,
                  totalTimeSpentSeconds: 0,
                  isPremium: false,
                  createdAt: now,
                  updatedAt: now,
                })
                .returning();

              user = {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                role: newUser.role,
              };
              session = { userId: newUser.id };
            } catch (insertErr: any) {
              logger.error('User insert failed', { error: insertErr?.message });
              throw insertErr;
            }
          }
        }
      }
    } catch (err) {
      logger.error('Auth verification error in createContext', err);
    }
  }

  return {
    db,
    redis,
    logger,
    requestId,
    session,
    user,
    clientIp: getClientIp(req),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
