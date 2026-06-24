'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { PasswordStrength } from '@/components/password-strength';
import { LoadingOverlay, LogoSpinner } from '@/components/ui/loading-logo';
import { CSS, ROUTES } from '@/lib/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/lib/schemas';

const wobbly = { borderRadius: CSS.radii.sm };

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const registerUser = useAuthStore((s) => s.register);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.full_name);
      toast.success('Account created successfully');
      router.push(ROUTES.dashboard);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-pencil shadow-hard p-8 rotate-[0.5deg] hover:rotate-0 transition-transform relative">
        {loading && <LoadingOverlay text="Creating account..." />}

        <div className={`transition-opacity ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-pencil bg-paper mb-4"
                 style={wobbly}>
              <Image
                src="/images/logo.png?v=2"
                alt="Typing Mania"
                width={40}
                height={40}
                className="w-10 h-10"
                style={{ borderRadius: CSS.radii.sm }}
              />
            </div>
            <h1 className="text-2xl font-bold text-pencil font-marker">Create Account</h1>
            <p className="text-base text-pencil/60 font-hand mt-1">Start your SSC typing journey</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-base font-bold text-pencil font-hand mb-1">
                <User className="w-4 h-4 inline mr-1" strokeWidth={3} /> Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                {...register('full_name')}
                className={`input-hand ${errors.full_name ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="Your full name"
                required
                autoComplete="name"
                disabled={loading}
                aria-invalid={!!errors.full_name}
                aria-describedby={errors.full_name ? 'reg-name-error' : undefined}
              />
              {errors.full_name && (
                <p id="reg-name-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-base font-bold text-pencil font-hand mb-1">
                <Mail className="w-4 h-4 inline mr-1" strokeWidth={3} /> Email
              </label>
              <input
                id="reg-email"
                type="email"
                {...register('email')}
                className={`input-hand ${errors.email ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="your@email.com"
                required
                autoComplete="email"
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'reg-email-error' : undefined}
              />
              {errors.email && (
                <p id="reg-email-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-base font-bold text-pencil font-hand mb-1">
                <Lock className="w-4 h-4 inline mr-1" strokeWidth={3} /> Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`input-hand pr-12 ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                  placeholder="6-128 characters"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'reg-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-pencil/50 hover:text-pencil transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                </button>
              </div>
              {errors.password && (
                <p id="reg-password-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.password.message}</p>
              )}
              <PasswordStrength password={passwordValue} />
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-base font-bold text-pencil font-hand mb-1">
                <Lock className="w-4 h-4 inline mr-1" strokeWidth={3} /> Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={`input-hand pr-12 ${errors.confirmPassword ? 'border-red-400 focus:border-red-500' : ''}`}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'reg-confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-pencil/50 hover:text-pencil transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="reg-confirm-password-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-hand w-full text-xl py-4 flex items-center justify-center gap-2">
              {loading ? <LogoSpinner text="Creating account..." /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-base text-pencil/60 font-hand">
            Already have an account?{' '}
             <Link href={ROUTES.authLogin} className="text-blue-pen font-bold hover:underline underline-offset-4 decoration-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
