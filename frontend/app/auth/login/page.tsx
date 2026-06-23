'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { LoadingOverlay, LogoSpinner } from '@/components/ui/loading-logo';
import { CSS, ROUTES } from '@/lib/config';

const wobbly = { borderRadius: CSS.radii.sm };

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const login = useAuthStore((s) => s.login);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      router.push(ROUTES.dashboard);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-pencil shadow-hard p-8 -rotate-[0.5deg] hover:rotate-0 transition-transform relative">
        {loading && <LoadingOverlay text="Signing in..." />}

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
            <h1 className="text-2xl font-bold text-pencil font-marker">Welcome Back</h1>
            <p className="text-base text-pencil/60 font-hand mt-1">Sign in to continue your practice</p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-base font-bold text-pencil font-hand mb-1">
                <Mail className="w-4 h-4 inline mr-1" strokeWidth={3} /> Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                onBlur={() => { if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setErrors((p) => ({ ...p, email: 'Invalid email format' })); }}
                className={`input-hand ${errors.email ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="your@email.com"
                required
                autoComplete="email"
                disabled={loading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
              {errors.email && (
                <p id="login-email-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-base font-bold text-pencil font-hand mb-1">
                <Lock className="w-4 h-4 inline mr-1" strokeWidth={3} /> Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`input-hand pr-12 ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
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
                <p id="login-password-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.password}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-hand w-full text-xl py-4 flex items-center justify-center gap-2">
              {loading ? <LogoSpinner text="Signing in..." /> : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-base text-pencil/60 font-hand">
            Don&apos;t have an account?{' '}
             <Link href={ROUTES.authRegister} className="text-blue-pen font-bold hover:underline underline-offset-4 decoration-2">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
