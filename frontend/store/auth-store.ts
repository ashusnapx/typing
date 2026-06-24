'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { setSupabaseToken, refreshTokenFromSession } from '@/lib/trpc-client';
import { clearLessonProgress } from '@/lib/lesson-storage';
import { clearTestResults } from '@/lib/test-storage';
import type { AuthError } from '@supabase/supabase-js';

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
  signInWithGoogle: () => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

function mapProfileToUser(data: any): AuthUser {
  return {
    id: data.id,
    email: data.email,
    full_name: data.fullName,
    role: data.role,
    xp: data.xp ?? 0,
    level: data.level ?? 1,
    is_premium: true,
  };
}

function getErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred.';

  const authErr = err as AuthError;
  if (authErr?.message && authErr?.code) {
    switch (authErr.code) {
      case 'user_already_exists':
      case 'email_exists':
        return 'An account with this email already exists. Please sign in instead.';
      case 'weak_password':
        return 'Password is too weak. Use at least 6 characters with a mix of letters, numbers, and symbols.';
      case 'invalid_credentials':
        return 'Invalid email or password. Please try again.';
      case 'email_not_confirmed':
        return 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
      case 'phone_not_confirmed':
        return 'Please confirm your phone number before signing in.';
      case 'bad_code_verifier':
        return 'The verification link has expired or is invalid. Please try signing up again.';
      case 'bad_oauth_state':
        return 'The OAuth sign-in failed due to a state mismatch. Please try again.';
      case 'bad_oauth_callback':
        return 'The OAuth callback was invalid. Please try again.';
      case 'bad_oauth_code_challenge_method':
        return 'OAuth configuration error. Please contact support.';
      case 'bad_jwt':
        return 'Your session has expired. Please sign in again.';
      case 'bad_refresh_token':
        return 'Your session has expired. Please sign in again.';
      case 'captcha_failed':
        return 'Captcha verification failed. Please try again.';
      case 'conflict':
        return 'A conflict occurred. Please try again.';
      case 'forbidden':
        return 'Access denied. You do not have permission.';
      case 'identity_not_found':
        return 'No account found with this identity. Please sign up first.';
      case 'insufficient_auth':
        return 'Additional authentication is required.';
      case 'flow_state_not_found':
        return 'The authentication flow has expired. Please try again.';
      case 'mfa_challenge_expired':
        return 'The MFA challenge has expired. Please try again.';
      case 'mfa_factor_name_conflict':
        return 'An MFA factor with this name already exists.';
      case 'mfa_factor_not_found':
        return 'MFA factor not found.';
      case 'mfa_ip_address_mismatch':
        return 'MFA IP address mismatch. Please try again.';
      case 'mfa_verification_failed':
        return 'MFA verification failed. Please try again.';
      case 'mfa_verification_rejected':
        return 'MFA verification was rejected.';
      case 'oauth_provider_not_enabled':
        return 'Google sign-in is not enabled. Please use email/password instead.';
      case 'otp_expired':
        return 'The one-time password has expired. Please request a new one.';
      case 'over_email_send_rate_limit':
        return 'Too many emails sent. Please wait a moment before trying again.';
      case 'over_request_rate_limit':
        return 'Too many requests. Please slow down and try again.';
      case 'phone_exists':
        return 'This phone number is already registered.';
      case 'provider_disabled':
        return 'This sign-in method is currently disabled.';
      case 'reauthentication_needed':
        return 'Please sign in again to continue.';
      case 'same_password':
        return 'New password must be different from your current password.';
      case 'session_expired':
        return 'Your session has expired. Please sign in again.';
      case 'signup_disabled':
        return 'Sign-up is currently disabled. Please contact support.';
      case 'too_many_enrolled_mfa_factors':
        return 'Too many MFA factors enrolled.';
      case 'unexpected_audience':
        return 'Unexpected authentication audience. Please sign in again.';
      case 'unexpected_failure':
        return 'An unexpected error occurred. Please try again.';
      case 'user_not_found':
        return 'No user found with this email. Please sign up first.';
      case 'validation_failed':
        return 'Please check your input and try again.';
      case 'verified':
        return 'Your account is already verified.';
      default:
        return authErr.message || 'An authentication error occurred. Please try again.';
    }
  }

  if (err instanceof Error) {
    const msg = err.message || '';
    if (msg.includes('Email not confirmed')) {
      return 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
    }
    if (msg.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (msg.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    return msg;
  }

  return 'An unexpected error occurred. Please try again.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(getErrorMessage(error));
    }

    if (data.session?.access_token) {
      setSupabaseToken(data.session.access_token);
    }

    try {
      const profile = await api.getMe();
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch {
      const fallbackEmail = data.user?.email || email;
      set({
        user: {
          id: data.user?.id || fallbackEmail,
          email: fallbackEmail,
          full_name: data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || fallbackEmail.split('@')[0],
          role: 'student',
          xp: 0,
          level: 1,
          is_premium: false,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },

  signInWithGoogle: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  register: async (email: string, password: string, full_name: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.code === 'user_already_exists' || error.message?.includes('already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      throw new Error(getErrorMessage(error));
    }

    if (!data.user) {
      throw new Error('Failed to create account. Please try again.');
    }

    if (data.session?.access_token) {
      setSupabaseToken(data.session.access_token);
    }

    if (data.session) {
      try {
        const profile = await api.getMe();
        set({ user: profile, isAuthenticated: true, isLoading: false });
      } catch {
        const fallbackEmail = data.user?.email || email;
        const displayName = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || fallbackEmail.split('@')[0];
        set({
          user: {
            id: data.user?.id || fallbackEmail,
            email: fallbackEmail,
            full_name: displayName,
            role: 'student',
            xp: 0,
            level: 1,
            is_premium: false,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } else {
      set({ user: null, isAuthenticated: false });
      throw new Error('confirmation_email_sent');
    }
  },

  logout: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase signOut error:', error.message);
    }
    setSupabaseToken(null);
    clearLessonProgress();
    clearTestResults();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      const supabase = createClient();

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Failed to get Supabase session:', sessionError.message);
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (!session) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      setSupabaseToken(session.access_token);

      supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'TOKEN_REFRESHED' && newSession?.access_token) {
          setSupabaseToken(newSession.access_token);
        }
        if (event === 'SIGNED_OUT') {
          setSupabaseToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      });

      try {
        const profile = await api.getMe();
        set({ user: profile, isAuthenticated: true, isLoading: false });
      } catch {
        try {
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          if (refreshedSession?.access_token) {
            setSupabaseToken(refreshedSession.access_token);
            const profile = await api.getMe();
            set({ user: profile, isAuthenticated: true, isLoading: false });
            return;
          }
        } catch {}
        const fallbackSession = (await supabase.auth.getSession()).data.session;
        if (fallbackSession?.user) {
          const u = fallbackSession.user;
          const fallbackEmail = u.email || '';
          set({
            user: {
              id: u.id || fallbackEmail,
              email: fallbackEmail,
              full_name: u.user_metadata?.full_name || u.user_metadata?.name || fallbackEmail.split('@')[0],
              role: 'student',
              xp: 0,
              level: 1,
              is_premium: false,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false, isAuthenticated: false });
        }
      }
    } catch (err) {
      console.error('loadUser error:', err);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  updateUser: (data: Partial<AuthUser>) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...data } });
    }
  },
}));
