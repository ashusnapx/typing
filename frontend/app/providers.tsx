'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadUser().finally(() => setInitialized(true));
  }, [loadUser]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <div className="flex flex-col items-center space-y-4">
          <div
            className="w-10 h-10 border-[3px] border-pencil border-t-accent animate-spin"
            style={wobbly}
          />
          <p className="text-lg text-pencil/60 font-hand">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
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
            borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            boxShadow: '4px 4px 0px 0px #2d2d2d',
          },
        }}
      />
    </QueryClientProvider>
  );
}
