'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, User, X } from 'lucide-react';
import { CSS, ROUTES } from '@/lib/config';

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
      toast.success('Signed in! Starting your test...');
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
      toast.success('Account created! Starting your test...');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-md w-full bg-white border-2 border-pencil shadow-hard p-6 relative" style={{ borderRadius: CSS.radii.sm }}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-pencil/40 hover:text-pencil"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <div className="text-center mb-5">
          <Image
            src="/images/logo.png?v=2"
            alt="Typing Mania"
            width={36}
            height={36}
            className="w-9 h-9 mx-auto mb-2 border border-pencil"
            style={{ borderRadius: CSS.radii.sm }}
          />
          <h2 className="text-lg font-bold text-pencil font-marker">
            {tab === 'login' ? 'Sign in to start' : 'Create account to start'}
          </h2>
          <p className="text-sm text-pencil/60 font-hand mt-0.5">
            {tab === 'login' ? 'Continue your SSC typing practice' : 'Track your progress & qualify for SSC'}
          </p>
        </div>

        <div className="flex mb-4 border-2 border-pencil" style={{ borderRadius: CSS.radii.sm }}>
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-sm font-bold font-hand transition-colors ${tab === 'login' ? 'bg-pencil text-white' : 'bg-white text-pencil'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 text-sm font-bold font-hand transition-colors ${tab === 'signup' ? 'bg-pencil text-white' : 'bg-white text-pencil'}`}
          >
            Sign Up
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-hand w-full text-sm"
              required
              autoComplete="email"
              disabled={loading}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-hand w-full text-sm pr-10"
                required
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-pencil/40 hover:text-pencil"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-hand w-full text-base py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-hand w-full text-sm"
              required
              autoComplete="name"
              disabled={loading}
            />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-hand w-full text-sm"
              required
              autoComplete="email"
              disabled={loading}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-hand w-full text-sm pr-10"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-pencil/40 hover:text-pencil"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-hand w-full text-base py-3">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
