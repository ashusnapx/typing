'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { setSupabaseToken } from '@/lib/trpc-client';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { ROUTES } from '@/lib/config';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  const setAuthState = (session: any) => {
    setSupabaseToken(session.access_token);
    const email = session.user?.email || '';
    useAuthStore.setState({
      user: {
        id: session.user?.id || email,
        email,
        full_name: session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || email.split('@')[0],
        role: 'student',
        xp: 0,
        level: 1,
        is_premium: false,
      },
      isAuthenticated: true,
      isLoading: false,
    });
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMsg(error.message);
          setStatus('error');
          return;
        }

        if (!session) {
          const params = new URLSearchParams(window.location.hash.replace('#', '?'));
          const accessToken = params.get('access_token');

          if (accessToken) {
            const { data: { session: hashSession }, error: hashError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: params.get('refresh_token') || '',
            });

            if (hashError || !hashSession) {
              setErrorMsg(hashError?.message || 'Failed to complete sign-in.');
              setStatus('error');
              return;
            }

            setAuthState(hashSession);
            try {
              await api.getMe();
            } catch {
              // Profile fetch is best-effort; auth session is already set
            }
            toast.success('Signed in successfully!');
            router.push(ROUTES.dashboard);
            return;
          }

          setErrorMsg('No session found. Please try signing in again.');
          setStatus('error');
          return;
        }

        setAuthState(session);

        try {
          await api.getMe();
        } catch {
          // Profile fetch is best-effort; auth session is already set
        }

        toast.success('Signed in successfully!');
        router.push(ROUTES.dashboard);
      } catch (err: any) {
        setErrorMsg(err.message || 'An unexpected error occurred.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 border-pencil shadow-hard p-8 text-center">
          <div className="w-16 h-16 border-2 border-red-400 bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-red-500">!</span>
          </div>
          <h1 className="text-xl font-bold text-pencil font-marker mb-3">Sign-in Failed</h1>
          <p className="text-base text-pencil/60 font-hand mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push(ROUTES.authLogin)}
            className="btn-hand inline-block text-lg px-8 py-3"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <LoadingLogo />;
}
