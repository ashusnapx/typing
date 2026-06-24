import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/src/server/trpc/root';
import { STORAGE_KEYS } from './config';

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(STORAGE_KEYS.token);
          return token ? { Authorization: `Bearer ${token}` } : {};
        }
        return {};
      },
    }),
  ],
});
