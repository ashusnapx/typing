'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES } from '@/lib/config';
import { registerSchema, type RegisterFormData } from '@/lib/schemas';
import { AuthShell } from '@/components/auth/auth-shell';
import { LogoSpinner } from '@/components/ui/loading-logo';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const registerUser = useAuthStore((s) => s.register);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.full_name);
      toast.success('Account created');
      router.push(ROUTES.dashboard);
    } catch (err: any) {
      toast.error(err?.message || 'Could not create your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Get <em>started</em>
        </>
      }
      panelTitle={
        <>
          Practise like it&rsquo;s <em>exam day</em>
        </>
      }
      subtitle="Free, and takes about twenty seconds."
      footer={
        <p className="text-center text-base text-vast/60">
          Already have an account?{' '}
          <Link
            href={ROUTES.authLogin}
            className="font-semibold text-vast underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
        <div>
          <label
            htmlFor="reg-name"
            className="mb-1.5 block text-sm font-medium text-vast/70"
          >
            Your name
          </label>
          <input
            id="reg-name"
            type="text"
            {...register('full_name')}
            className="field-line"
            placeholder="Priya Sharma"
            autoComplete="name"
            autoFocus
            disabled={loading}
            aria-invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? 'reg-name-error' : undefined}
          />
          {errors.full_name && (
            <p id="reg-name-error" role="alert" className="mt-2 text-sm text-err">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="mb-1.5 block text-sm font-medium text-vast/70"
          >
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            {...register('email')}
            className="field-line"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'reg-email-error' : undefined}
          />
          {errors.email && (
            <p id="reg-email-error" role="alert" className="mt-2 text-sm text-err">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="mb-1.5 block text-sm font-medium text-vast/70"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="field-line pr-11"
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={loading}
              aria-invalid={!!errors.password}
              aria-describedby="reg-password-hint"
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
          {errors.password ? (
            <p id="reg-password-hint" role="alert" className="mt-2 text-sm text-err">
              {errors.password.message}
            </p>
          ) : (
            <p id="reg-password-hint" className="mt-2 text-sm text-vast/50">
              At least 8 characters.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? <LogoSpinner text="Creating account…" /> : 'Create account'}
        </button>
      </form>

    </AuthShell>
  );
}
