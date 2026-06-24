import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { users } from '../db/schema/users';
import { eq } from 'drizzle-orm';
import { logger } from '../observability/logger';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(Buffer.from(b64, 'base64').toString());
  } catch {
    return null;
  }
}

export async function createContext(opts: FetchCreateContextFnOptions) {
  const req = opts.req;

  const requestId = req.headers.get('X-Request-ID') || `req_${Math.random().toString(36).substring(2, 15)}`;

  let session: any = null;
  let user: UserSession | null = null;

  const authHeader = req.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    console.log('[context] Token found, length:', token.length);
    try {
      const payload = decodeJwtPayload(token);
      const decodedSub = payload?.sub || null;
      const decodedEmail = payload?.email || null;
      const decodedMeta = payload?.user_metadata || {};
      console.log('[context] JWT decoded:', { sub: decodedSub, email: decodedEmail, payloadKeys: payload ? Object.keys(payload) : null });

      if (!decodedSub || !decodedEmail) {
        console.error('[context] JWT missing sub or email claim');
        logger.warn('JWT missing sub or email claim', { hasSub: !!decodedSub, hasEmail: !!decodedEmail });
      } else {
        console.log('[context] Looking up user by email:', decodedEmail);
        const [existingUser] = await db
          .select({
            id: users.id,
            email: users.email,
            fullName: users.fullName,
            role: users.role,
          })
          .from(users)
          .where(eq(users.email, decodedEmail))
          .limit(1);

        if (existingUser) {
          console.log('[context] Found existing user:', existingUser.id, existingUser.email);
          user = {
            id: existingUser.id,
            email: existingUser.email,
            fullName: existingUser.fullName,
            role: existingUser.role,
          };
          session = { userId: existingUser.id };
        } else {
          console.log('[context] No user found, creating new user with id:', decodedSub);
          const displayName = decodedMeta.full_name || decodedMeta.name || decodedEmail.split('@')[0] || 'User';
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

            console.log('[context] Created new user:', newUser.id, newUser.email);
            user = {
              id: newUser.id,
              email: newUser.email,
              fullName: newUser.fullName,
              role: newUser.role,
            };
            session = { userId: newUser.id };
          } catch (insertErr: any) {
            console.error('[context] User insert failed:', insertErr?.message || insertErr);
            console.error('[context] Full insert error:', JSON.stringify(insertErr, null, 2));
            throw insertErr;
          }
        }
      }
    } catch (err) {
      console.error('[context] Auth verification error:', err);
      logger.error('Supabase auth verification failed in createContext:', err);
    }
  } else {
    console.warn('[context] No token found in Authorization header or cookies');
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
