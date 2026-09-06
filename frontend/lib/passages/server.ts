import 'server-only';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { POOL_COLUMNS, type PoolPassage } from './pool';

/**
 * Server-side passage pool, cached across requests.
 *
 * Passages are public reference data that changes when we ship a migration,
 * not per request — so this uses the anon key with no cookie context, which
 * keeps it cacheable. On Vercel the result is held in the data cache and
 * served from the edge, so a warm request does no database work at all.
 *
 * Revalidate with `revalidateTag('passages')` after seeding new passages.
 */

const REVALIDATE_SECONDS = 3600;

async function fetchPool(): Promise<PoolPassage[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // A missing key must not take the exam pages down — the client keeps a
  // local fallback, so an empty pool degrades rather than throws.
  if (!url || !key) return [];

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('passages')
    .select(POOL_COLUMNS)
    .eq('is_active', true);

  if (error || !data) return [];
  return data as unknown as PoolPassage[];
}

export const getPassagePool = unstable_cache(fetchPool, ['passage-pool-v1'], {
  revalidate: REVALIDATE_SECONDS,
  tags: ['passages'],
});
