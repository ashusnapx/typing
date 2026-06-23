'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { usePathname } from 'next/navigation';
import { CSS } from '@/lib/config';
import { initCapsLockTracker } from '@/lib/caps-lock-tracker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((s) => s.loadUser);
  const called = useRef(false);

  useEffect(() => {
    initCapsLockTracker();
    if (called.current) return;
    called.current = true;
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
}

function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <AuthInitializer>
        {children}
      </AuthInitializer>
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
