'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-pencil shadow-hard p-8 rotate-[0.5deg] hover:rotate-0 transition-transform">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-pencil bg-postit mb-4"
               style={wobbly}>
            <UserPlus className="w-6 h-6 text-pencil" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-bold text-pencil font-marker">Create Account</h1>
          <p className="text-base text-pencil/60 font-hand mt-1">Start your SSC typing journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-bold text-pencil font-hand mb-1">
              <User className="w-4 h-4 inline mr-1" strokeWidth={3} /> Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-hand"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-pencil font-hand mb-1">
              <Mail className="w-4 h-4 inline mr-1" strokeWidth={3} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-hand"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-base font-bold text-pencil font-hand mb-1">
              <Lock className="w-4 h-4 inline mr-1" strokeWidth={3} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-hand"
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-hand w-full text-xl py-4">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-base text-pencil/60 font-hand">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-pen font-bold hover:underline underline-offset-4 decoration-2">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
