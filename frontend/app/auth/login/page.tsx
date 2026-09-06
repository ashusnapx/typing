'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/lib/config';
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { AuthShell } from '@/components/auth/auth-shell';
import { LogoSpinner } from '@/components/ui/loading-logo';

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
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

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Signed in');
      // Only ever an in-app path — never an arbitrary URL from the query string.
      const next = params.get('next');
      const safe =
        next && next.startsWith('/') && !next.startsWith('//') ? next : null;
      router.push(safe ?? ROUTES.dashboard);
    } catch (err: any) {
      toast.error(err?.message || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
