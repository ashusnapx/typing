'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CSS, ROUTES } from '@/lib/config';
import { initCapsLockTracker } from '@/lib/caps-lock-tracker';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated, loadUser } = useAuthStore();
  const called = useRef(false);
  const publicPaths = ['/', '/auth/login', '/auth/register', '/faq', '/about', '/contact', '/privacy', '/terms'];

  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith('/exam/lesson/'));

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    if (api.getToken()) {
      loadUser();
    } else {
      useAuthStore.setState({ isLoading: false, isAuthenticated: false });
    }
  }, [loadUser]);

  if (!isPublic && !isLoading && !isAuthenticated) {
    router.replace(ROUTES.authLogin);
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
  useEffect(() => { initCapsLockTracker(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <AuthGate>
        {children}
      </AuthGate>
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
