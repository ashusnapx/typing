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

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  let body: { email?: string; password?: string; full_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const fullName = body.full_name?.trim();

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
      user_metadata: { full_name: fullName || email.split('@')[0] },
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
