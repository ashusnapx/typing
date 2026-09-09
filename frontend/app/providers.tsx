'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useRef, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initCapsLockTracker } from '@/lib/caps-lock-tracker';
import { useAuthStore } from '@/store/auth-store';
import { ErrorBoundary } from '@/components/error-boundary';
import { CompleteProfileModal } from '@/components/auth/complete-profile-modal';
import { useTypingStore } from '@/store/typing-store';
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

/** The modal asks for a phone number. Doing that over a live timed skill test
 *  would cost the candidate their attempt, so it waits — the exam screens
 *  raise the same flag that hides the site navbar. */
function ProfileGate() {
  const navHidden = useTypingStore((s) => s.navHidden);
  const pathname = usePathname();
  if (navHidden || pathname.startsWith('/auth/')) return null;
  return <CompleteProfileModal />;
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
        <ProfileGate />
      </ErrorBoundary>
      {/* Appearance lives in globals.css under `.tm-toast`. The inline styles
          this replaces pointed at --ink, --text-inverse and --shadow-lg, none
          of which are defined, so every toast rendered with no background at
          all — invisible on a cream page. */}
      <Toaster
        position="bottom-center"
        gutter={10}
        toastOptions={{
          duration: 3200,
          className: 'tm-toast',
          success: { duration: 2600, iconTheme: { primary: 'rgb(var(--ok))', secondary: 'rgb(var(--lumen))' } },
          error: { duration: 4500, iconTheme: { primary: 'rgb(var(--flare))', secondary: 'rgb(var(--lumen))' } },
        }}
      />
    </QueryClientProvider>
  );
}

export { PRIVATE_ROUTE_PREFIXES };
