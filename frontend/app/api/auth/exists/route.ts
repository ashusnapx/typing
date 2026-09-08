import { NextResponse } from 'next/server';
import { db } from '@/src/server/db/client';
import { users } from '@/src/server/db/schema/users';
import { eq } from 'drizzle-orm';

/**
 * Does an account exist for this email?
 *
 * Supabase returns the same "Invalid login credentials" whether the password
 * was wrong or the account was never created, which is good for enumeration
 * and bad for the person typing: sign-in dead-ended on "Wrong email or
 * password" with no way forward for someone who simply had not signed up yet.
 * This lets the sign-in screen say which of the two happened, and offer to
 * finish the sign-up rather than leaving them stuck.
 *
 * It is an enumeration oracle, and worth being honest about that. It reveals
 * nothing /api/auth/signup does not already reveal — that route answers 409
 * "That email already has an account" — so the exposure is not new, and it is
 * rate limited per IP so it cannot be used to sweep a list.
 *
 * It returns a boolean and nothing else. No name, no id, no timing difference
 * worth reading.
 */

export const runtime = 'nodejs';

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Twenty checks a minute: far more than a person signing in will ever need,
 * far too few to walk a mailing list with.
 *
 * Imported lazily and failing open on purpose. The limiter reaches for Redis
 * at module load and throws outright when REDIS_URL is unset, which would turn
 * every check into a 500 and hand the dead-end message straight back to the
 * person this endpoint exists for. The exposure it guards is already present
 * on /api/auth/signup, which answers 409 for a known email with no limiting at
 * all — so a degraded Redis costing us the limit is a smaller harm than a
 * degraded Redis costing us sign-in.
 */
async function withinRateLimit(identifier: string): Promise<boolean> {
  try {
    const { RateLimiter } = await import('@/src/server/redis/rate-limit');
    return await RateLimiter.checkLimit({
      action: 'auth-exists',
      identifier,
      maxTokens: 20,
      windowSeconds: 60,
    });
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (!(await withinRateLimit(clientIp(request)))) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    // The profile row is created with the auth user by the trigger, so its
    // presence answers the question without touching the auth schema.
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return NextResponse.json({ exists: !!row });
  } catch {
    // Never guess. A failed lookup must not be reported as "no account", or
    // the sign-in screen would invite someone to re-create an account they
    // already have.
    return NextResponse.json(
      { error: 'Could not check that email. Try again.' },
      { status: 503 }
    );
  }
}
