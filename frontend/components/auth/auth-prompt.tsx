'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Eye, EyeOff, X } from 'lucide-react';
import { APP } from '@/lib/config';

interface AuthPromptProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthPrompt({ onClose, onSuccess }: AuthPromptProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in — starting your test');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created — starting your test');
      onSuccess();
    } catch (err: any) {
      if (err.message === 'confirmation_email_sent') {
        toast.success('Check your email to confirm, then sign in.', { duration: 5000 });
        setTab('login');
      } else {
        toast.error(err.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  /** The show/hide control is identical in both panels, so it is built once
   *  rather than duplicated across them. */
  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      tabIndex={-1}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-vast/50 transition-colors hover:text-vast"
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Eye className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-vast/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
    >
      <div className="card relative w-full max-w-md p-6 sm:p-7">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-vast/40 transition-colors hover:text-vast"
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <div className="text-center">
          <Image
            src={APP.logo}
            alt=""
            width={36}
            height={36}
            className="mx-auto h-9 w-9 rounded-lg border-2 border-vast"
          />
          <h2 id="auth-prompt-title" className="mt-4 text-3xl">
            {tab === 'login' ? (
              <>
                Sign in to <em>start</em>
              </>
            ) : (
              <>
                Create an <em>account</em>
              </>
            )}
          </h2>
          <p className="mt-3 text-base text-vast/60">
            {tab === 'login'
              ? 'Continue your SSC typing practice.'
              : 'Track your progress and measure yourself against the SSC bar.'}
          </p>
        </div>

        {/* Only the selected panel is mounted, so aria-controls is set on the
            selected tab alone — an idref to an absent node is worse than none. */}
        <div className="segment mt-5 flex w-full" role="tablist" aria-label="Sign in or sign up">
          <button
            id="auth-tab-login"
            role="tab"
            type="button"
            aria-selected={tab === 'login'}
            aria-controls={tab === 'login' ? 'auth-panel-login' : undefined}
            onClick={() => setTab('login')}
            className="segment-item flex-1"
          >
            Sign in
          </button>
          <button
            id="auth-tab-signup"
            role="tab"
            type="button"
            aria-selected={tab === 'signup'}
            aria-controls={tab === 'signup' ? 'auth-panel-signup' : undefined}
            onClick={() => setTab('signup')}
            className="segment-item flex-1"
          >
            Sign up
          </button>
        </div>

        {tab === 'login' ? (
          <form
            id="auth-panel-login"
            role="tabpanel"
            aria-labelledby="auth-tab-login"
            onSubmit={handleLogin}
            className="mt-5 space-y-3"
          >
            <label htmlFor="auth-login-email" className="sr-only">
              Email
            </label>
            <input
              id="auth-login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              required
              autoComplete="email"
              disabled={loading}
            />
            <div className="relative">
              <label htmlFor="auth-login-password" className="sr-only">
                Password
              </label>
              <input
                id="auth-login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pr-11"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              {passwordToggle}
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form
            id="auth-panel-signup"
            role="tabpanel"
            aria-labelledby="auth-tab-signup"
            onSubmit={handleSignup}
            className="mt-5 space-y-3"
          >
            <label htmlFor="auth-signup-name" className="sr-only">
              Full name
            </label>
            <input
              id="auth-signup-name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              required
              autoComplete="name"
              disabled={loading}
            />
            <label htmlFor="auth-signup-email" className="sr-only">
              Email
            </label>
            <input
              id="auth-signup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              required
              autoComplete="email"
              disabled={loading}
            />
            <div className="relative">
              <label htmlFor="auth-signup-password" className="sr-only">
                Password
              </label>
              <input
                id="auth-signup-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password — at least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field pr-11"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
              />
              {passwordToggle}
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-vast/50">
          You don&apos;t need an account to practise — close this and keep typing.
        </p>
      </div>
    </div>
  );
}
