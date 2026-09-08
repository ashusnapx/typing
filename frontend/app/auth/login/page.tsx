'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/client';
import { prefetchDashboard } from '@/lib/queries';
import { ROUTES } from '@/lib/config';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { AuthShell } from '@/components/auth/auth-shell';
import { LogoSpinner } from '@/components/ui/loading-logo';
import { FinishSignupModal } from '@/components/auth/finish-signup-modal';
import type { IdentityValues } from '@/components/auth/identity-fields';

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Held only while the modal is open, and only in memory — the credentials
  // the candidate already typed, so the sign-up does not ask for them twice.
  const [pendingSignup, setPendingSignup] = useState<
    { email: string; password: string } | null
  >(null);
  const login = useAuthStore((s) => s.login);
  const registerAccount = useAuthStore((s) => s.register);
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  /**
   * Recover a session the server could not see.
   *
   * The middleware decides who is signed in from the auth cookie. A browser
   * can hold a perfectly good Supabase session while that cookie is missing or
   * expired — an older cookie format, a cleared cookie, a token that lapsed
   * while the tab was closed — and the result is a bounce to this page from
   * someone who is, as far as their browser is concerned, already logged in.
   * They were shown a login form with no explanation.
   *
   * Refreshing the session rewrites the cookie, which is all the server was
   * missing. Guarded by a one-shot flag: if the cookie still does not take, the
   * form is shown rather than bouncing between here and the page they wanted.
   */
  const recovery = useRef(false);
  useEffect(() => {
    const next = params.get('next');
    if (!next || recovery.current) return;
    recovery.current = true;

    let cancelled = false;
    (async () => {
      try {
        if (sessionStorage.getItem('tm-session-recovered') === '1') return;
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session || cancelled) return;
        // Rewrites the auth cookie the middleware reads.
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (!refreshed.session || cancelled) return;
        sessionStorage.setItem('tm-session-recovered', '1');
        toast.success('Welcome back');
        router.replace(next.startsWith('/') && !next.startsWith('//') ? next : ROUTES.dashboard);
      } catch {
        /* fall through to the form */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  /** Only ever an in-app path — never an arbitrary URL from the query string. */
  const nextPath = () => {
    const next = params.get('next');
    return next && next.startsWith('/') && !next.startsWith('//')
      ? next
      : ROUTES.dashboard;
  };

  const goIn = () => {
    // Starts the dashboard round trip now, so it overlaps the route transition
    // instead of beginning after the page mounts.
    prefetchDashboard(queryClient);
    router.push(nextPath());
  };

  /**
   * Supabase answers a wrong password and a non-existent account with the same
   * message, so "Wrong email or password" was the only thing we could say —
   * and it is the wrong thing to say to someone who has not signed up yet.
   * Ask which it was, and only then decide what to show.
   */
  const accountExists = async (email: string): Promise<boolean | null> => {
    try {
      const res = await fetch('/api/auth/exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return null;
      const { exists } = await res.json();
      return typeof exists === 'boolean' ? exists : null;
    } catch {
      // Unknown, not "no account". Inviting someone to re-create an account
      // they already have is worse than the generic message.
      return null;
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      try {
        sessionStorage.removeItem('tm-session-recovered');
      } catch {
        /* private mode */
      }
      toast.success('Signed in');
      goIn();
    } catch (err: any) {
      const wrongCredentials = /wrong email or password/i.test(err?.message || '');
      if (wrongCredentials) {
        const exists = await accountExists(data.email);
        if (exists === false) {
          // No dead end: carry the credentials into the sign-up they meant.
          setPendingSignup({ email: data.email, password: data.password });
          setLoading(false);
          return;
        }
        // The account is there, so the password is the part that was wrong —
        // which is more useful than the message that covers both.
        toast.error(
          exists === true ? 'Wrong password.' : err?.message || 'Could not sign in'
        );
      } else {
        toast.error(err?.message || 'Could not sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const finishSignup = async (values: IdentityValues) => {
    if (!pendingSignup) return;
    setLoading(true);
    try {
      await registerAccount(
        pendingSignup.email,
        pendingSignup.password,
        values.full_name,
        { father_name: values.father_name, phone: values.phone }
      );
      setPendingSignup(null);
      toast.success('Account created');
      goIn();
    } catch (err: any) {
      toast.error(err?.message || 'Could not create your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {pendingSignup && (
      <FinishSignupModal
        email={pendingSignup.email}
        submitting={loading}
        onSubmit={finishSignup}
        onClose={() => setPendingSignup(null)}
      />
    )}
    <AuthShell
      title={
        <>
          Welcome <em>back</em>
        </>
      }
      subtitle="Sign in to keep your history and progress."
      footer={
        <p className="text-center text-base text-vast/60">
          No account?{' '}
          <Link
            href={ROUTES.authRegister}
            className="font-semibold text-vast underline underline-offset-4"
          >
            Create one free
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-medium text-vast/70"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            {...register('email')}
            className="field-line"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
          />
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-2 text-sm text-err">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-sm font-medium text-vast/70"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="field-line pr-11"
              placeholder="Your password"
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? 'login-password-error' : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-vast/40 transition-colors hover:text-vast"
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.8} />
              ) : (
                <Eye className="h-[18px] w-[18px]" strokeWidth={1.8} />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="login-password-error"
              role="alert"
              className="mt-2 text-sm text-err"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? <LogoSpinner text="Signing in…" /> : 'Continue'}
        </button>
      </form>
    </AuthShell>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
