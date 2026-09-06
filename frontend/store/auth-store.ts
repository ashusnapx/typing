'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { setSupabaseToken } from '@/lib/trpc-client';
import { clearLessonProgress } from '@/lib/lesson-storage';
import { clearTestResults } from '@/lib/test-storage';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Email + password auth. Nothing else.
 *
 * The previous store carried Google OAuth, MFA error mapping, email
 * confirmation handling and three nested profile-fetch fallbacks — roughly 350
 * lines to answer "who is signed in". Two things let it collapse:
 *
 *  - `users.id` is now the same UUID as `auth.users.id`, and a database
 *    trigger creates the profile row with the auth user, so the profile always
 *    exists by the time we look for it.
 *  - The session already carries the id, email and name, so a failed profile
 *    read degrades to a usable signed-in state instead of an error.
 *
 * Sign-up does NOT go through `supabase.auth.signUp`, which obeys the
 * project's "Confirm email" setting and hands back a user with no session when
 * it is on. It posts to /api/auth/signup instead, where the service role
 * creates the user already confirmed — so there is no confirmation step, no
 * OTP, and no dashboard toggle to remember.
 */

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  xp: number;
  level: number;
  is_premium: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

/** What we know from the session alone, before any profile read. */
function userFromSession(u: User): AuthUser {
  const email = u.email ?? '';
  return {
    id: u.id,
    email,
    full_name:
      u.user_metadata?.full_name?.trim() ||
      u.user_metadata?.name?.trim() ||
      email.split('@')[0] ||
      'Candidate',
    role: 'student',
    xp: 0,
    level: 1,
    is_premium: false,
  };
}

/** Enrich with the profile row. Never throws — a missing or unreadable profile
 *  degrades to the session-derived user rather than blocking sign-in. */
async function withProfile(u: User): Promise<AuthUser> {
  const base = userFromSession(u);
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('full_name, role, xp, level, is_premium')
      .eq('id', u.id)
      .maybeSingle();

    if (!data) return base;
    return {
      ...base,
      full_name: data.full_name || base.full_name,
      role: data.role || base.role,
      xp: data.xp ?? 0,
      level: data.level ?? 1,
      is_premium: !!data.is_premium,
    };
  } catch {
    return base;
  }
}

function friendlyError(message?: string): string {
  const m = (message || '').toLowerCase();
  // A fetch that never reached Supabase means the URL is wrong or the project
  // is gone — not a credentials problem. Saying "wrong password" there sends
  // people off debugging the wrong thing entirely.
  if (m.includes('failed to fetch') || m.includes('fetch failed') || m.includes('networkerror') || m.includes('load failed') || m.includes('enotfound'))
    return 'Could not reach the server. Check NEXT_PUBLIC_SUPABASE_URL in .env.local, then restart the dev server.';
  if (m.includes('invalid login credentials')) return 'Wrong email or password.';
  if (m.includes('already registered') || m.includes('already exists') || m.includes('already has an account'))
    return 'That email already has an account. Sign in instead.';
  if (m.includes('password')) return 'Password must be at least 8 characters.';
  if (m.includes('email')) return 'Enter a valid email address.';
  return message || 'Something went wrong. Try again.';
}

async function applySession(
  session: Session,
  set: (partial: Partial<AuthState>) => void
) {
  setSupabaseToken(session.access_token);
  const user = await withProfile(session.user);
  set({ user, isAuthenticated: true, isLoading: false });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(friendlyError(error.message));
    if (!data.session) throw new Error('Could not start a session. Try again.');
    await applySession(data.session, set);
  },

  register: async (email, password, full_name) => {
    // Created server-side with email_confirm already set, so the project's
    // "Confirm email" switch cannot strand the user without a session.
    let res: Response;
    try {
      res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, full_name }),
      });
    } catch (err: any) {
      throw new Error(friendlyError(err?.message));
    }

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: '' }));
      throw new Error(friendlyError(error));
    }

    // Straight into a session — same path as a normal sign-in.
    await get().login(email, password);
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut().catch(() => {});
    setSupabaseToken(null);
    clearLessonProgress();
    clearTestResults();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      const supabase = createClient();

      // Keep the tRPC token and the store in step with Supabase's own session
      // lifecycle instead of polling for it.
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setSupabaseToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        setSupabaseToken(session.access_token);
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      await applySession(session, set);
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateUser: (data) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...data } });
  },
}));
