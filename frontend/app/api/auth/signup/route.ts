import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Sign-up, without email confirmation.
 *
 * Supabase's own `auth.signUp` respects the project's "Confirm email" setting,
 * so with it switched on the browser gets a user but no session and the person
 * is stuck until they click a link. Creating the user here with the service
 * role and `email_confirm: true` marks it verified at creation, so the client
 * can sign in immediately — no confirmation, no OTP, no dashboard change.
 *
 * The service role key never leaves the server. This route does exactly one
 * thing (create a user) and returns no token; the client signs in normally
 * afterwards, so a leaked response is worth nothing.
 */

export const runtime = 'nodejs';

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * The limit this route was missing.
 *
 * /api/auth/exists is capped at twenty checks a minute precisely so nobody can
 * walk a mailing list through it — and this route answered 409 for a known
 * email, unlimited, which handed back the same oracle with none of the cost.
 * A limit on one of two doors is not a limit.
 *
 * Ten a minute per address: more than anyone creating an account needs, and
 * slow enough that enumeration and signup spam both stop being practical.
 * Fails open like its sibling, for the same reason — a Redis outage should
 * cost us the limit, not the ability to register.
 */
async function withinRateLimit(identifier: string): Promise<boolean> {
  try {
    const { RateLimiter } = await import('@/src/server/redis/rate-limit');
    return await RateLimiter.checkLimit({
      action: 'auth-signup',
      identifier,
      maxTokens: 10,
      windowSeconds: 60,
    });
  } catch {
    return true;
  }
}

/** Longest value we will read out of any single field. */
const MAX_FIELD = 200;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  let body: {
    email?: string;
    password?: string;
    full_name?: string;
    father_name?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!(await withinRateLimit(clientIp(request)))) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a minute and try again.' },
      { status: 429 }
    );
  }

  /* Nothing is read past a sane length.
     These strings go on to Supabase and into a row; an unbounded one is a
     megabyte of someone else's choosing travelling through both. Truncating
     rather than rejecting keeps a long real name working. */
  const cut = (v: unknown) =>
    typeof v === 'string' ? v.slice(0, MAX_FIELD).trim() : undefined;

  const email = cut(body.email)?.toLowerCase();
  const password = typeof body.password === 'string' ? body.password : undefined;
  const fullName = cut(body.full_name);
  const fatherName = cut(body.father_name);
  // Digits only. The client already strips as you type; this is the guard for
  // anything that did not come through the form.
  /* `?.` only guards null and undefined. A client sending `phone: 12345` gets
     past it and then throws on .replace, turning a bad request into a 500 —
     so the type is checked, not assumed. */
  const phone = cut(body.phone)?.replace(/\D/g, '');

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }
  /* An upper bound as well as a lower one. Hashing cost rises with length, so
     an unbounded password field is a way to spend our CPU on request. */
  if (password.length > 72) {
    return NextResponse.json(
      { error: 'Password must be 72 characters or fewer.' },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Enter a valid email address.' },
      { status: 400 }
    );
  }
  // Both are optional here on purpose: the in-exam sign-up prompt collects
  // only a name, and the profile-completion modal asks for the rest later. But
  // anything that IS supplied has to be valid, or a bad number reaches the row
  // and the modal never asks again.
  if (phone && !/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: 'Enter the 10 digits after +91, starting 6, 7, 8 or 9.' },
      { status: 400 }
    );
  }

  const supabase = admin();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          'Server is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.',
      },
      { status: 500 }
    );
  }

  let error: { message: string } | null;
  try {
    ({ error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      // The trigger in 20260908000000 reads these into the profile row, and
      // treats an empty string as "not answered".
      user_metadata: {
        full_name: fullName || email.split('@')[0],
        father_name: fatherName || '',
        phone: phone || '',
      },
    }));
  } catch {
    return NextResponse.json(
      {
        error:
          'Could not reach the auth server. Check NEXT_PUBLIC_SUPABASE_URL and the Supabase project status.',
      },
      { status: 502 }
    );
  }

  if (error) {
    const message = /already|registered|exists/i.test(error.message)
      ? 'That email already has an account. Sign in instead.'
      : error.message;
    // 409 for a duplicate so the client can tell it apart from a real failure.
    return NextResponse.json(
      { error: message },
      { status: /already|registered|exists/i.test(error.message) ? 409 : 400 }
    );
  }

  // The database trigger creates the matching profile row.
  return NextResponse.json({ ok: true });
}
