'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { PasswordStrength } from '@/components/password-strength';
import { LoadingOverlay, LogoSpinner } from '@/components/ui/loading-logo';
import { CSS, ROUTES } from '@/lib/config';

const wobbly = { borderRadius: CSS.radii.sm };

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const register = useAuthStore((s) => s.register);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Full name is required';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    else if (password.length > 128) errs.password = 'Password is too long';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email, password, name);
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

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-base font-bold text-pencil font-hand mb-1">
                <User className="w-4 h-4 inline mr-1" strokeWidth={3} /> Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                onBlur={() => { if (name.trim() && name.trim().length < 2) setErrors((p) => ({ ...p, name: 'Name must be at least 2 characters' })); }}
                className={`input-hand ${errors.name ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="Your full name"
                required
                autoComplete="name"
                disabled={loading}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'reg-name-error' : undefined}
              />
              {errors.name && (
                <p id="reg-name-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-base font-bold text-pencil font-hand mb-1">
                <Mail className="w-4 h-4 inline mr-1" strokeWidth={3} /> Email
              </label>
              <input
                id="reg-email"
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
                aria-describedby={errors.email ? 'reg-email-error' : undefined}
              />
              {errors.email && (
                <p id="reg-email-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.email}</p>
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
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`input-hand pr-12 ${errors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="6-16 characters"
                required
                minLength={6}
                maxLength={16}
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
                <p id="reg-password-error" className="mt-1 text-sm text-red-500 font-hand" role="alert">{errors.password}</p>
              )}
              <PasswordStrength password={password} />
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
