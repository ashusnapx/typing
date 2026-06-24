'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useRef, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CSS } from '@/lib/config';
import { initCapsLockTracker } from '@/lib/caps-lock-tracker';
import { useAuthStore } from '@/store/auth-store';
import { ErrorBoundary } from '@/components/error-boundary';
import { syncManager } from '@/lib/offline/sync-manager';

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated, loadUser } = useAuthStore();
  const called = useRef(false);
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/callback', '/faq', '/about', '/contact', '/privacy', '/terms', '/learn', '/blog', '/coach'];

  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/exam/lesson/') || pathname.startsWith('/exam/'));

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isPublic && !isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isPublic, isLoading, isAuthenticated, router]);

  if (!isPublic && !isLoading && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => {
    initCapsLockTracker();
    syncManager.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ScrollToTop />
        <AuthGate>
          {children}
        </AuthGate>
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#2d2d2d',
            color: '#fdfbf7',
            fontFamily: 'Patrick Hand, cursive',
            border: '3px solid #2d2d2d',
            borderRadius: CSS.radii.sm,
            boxShadow: '4px 4px 0px 0px #2d2d2d',
          },
        }}
      />
    </QueryClientProvider>
  );
}
