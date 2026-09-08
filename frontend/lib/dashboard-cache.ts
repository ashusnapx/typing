/**
 * Last dashboard payload, kept in localStorage.
 *
 * A returning user sees their real figures on the first frame while the fresh
 * copy is still in flight, instead of a skeleton. Its own module because both
 * the query that writes it and the auth store that must drop it on sign-out
 * need the key, and queries.ts already imports the auth store.
 */

const KEY = 'tm-dashboard-v1';
/** A day-old dashboard is worse than a skeleton — it would show figures the
 *  user has already improved on, which reads as a bug. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function readDashboardCache(): { data: any; at: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDashboardCache(data: any) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ data, at: Date.now() }));
  } catch {
    /* private mode or quota */
  }
}

export function clearDashboardCache() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
