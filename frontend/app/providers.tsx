'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useRef, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initCapsLockTracker } from '@/lib/caps-lock-tracker';
import { useAuthStore } from '@/store/auth-store';
import { ErrorBoundary } from '@/components/error-boundary';
import { syncManager } from '@/lib/offline/sync-manager';
import { PRIVATE_ROUTE_PREFIXES, isPrivateRoute } from '@/lib/route-access';

/** Guards only the routes that genuinely need an account.
 *
 *  Everything else — including every exam and lesson — is open. An aspirant
 *  evaluating the tool must be able to finish a full test before being asked
 *  for an email; the sign-up ask belongs on the results screen, where the
 *  thing being saved is visible and worth saving. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated, loadUser } = useAuthStore();
  const called = useRef(false);
  const isPrivate = isPrivateRoute(pathname);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (isPrivate && !isLoading && !isAuthenticated) {
      const next = encodeURIComponent(pathname);
      router.replace(`/auth/login?next=${next}`);
    }
  }, [isPrivate, isLoading, isAuthenticated, pathname, router]);

  if (isPrivate && !isLoading && !isAuthenticated) return null;

  return <>{children}</>;
}

function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    initCapsLockTracker();
    syncManager.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ScrollToTop />
        <AuthGate>{children}</AuthGate>
      </ErrorBoundary>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3200,
          className: 'tm-toast',
          style: {
            background: 'rgb(var(--ink))',
            color: 'rgb(var(--text-inverse))',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: '90vw',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export { PRIVATE_ROUTE_PREFIXES };
