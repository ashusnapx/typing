import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/src/server/trpc/root';
import { createClient } from './supabase/client';

let currentToken: string | null = null;

export function getToken(): string | null {
  return currentToken;
}

export async function refreshTokenFromSession(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || null;
    currentToken = token;
    return token;
  } catch {
    return null;
  }
}

export function setSupabaseToken(token: string | null) {
  currentToken = token;
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        return currentToken ? { Authorization: `Bearer ${currentToken}` } : {};
      },
    }),
  ],
});
