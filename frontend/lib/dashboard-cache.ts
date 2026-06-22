const CACHE_KEY = 'dashboard';
const CACHE_TTL = 3 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttl: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiry: Date.now() + ttl };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

export function cacheIsFresh(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const entry = JSON.parse(raw);
    return Date.now() < entry.expiry;
  } catch {
    return false;
  }
}

export function cacheInvalidate(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

function get<T>(key: string): T | null {
  return cacheGet<T>(key);
}

function set<T>(key: string, data: T, ttl: number): void {
  cacheSet(key, data, ttl);
}

export function getCachedDashboard(): any | null {
  return get<any>(CACHE_KEY);
}

export function setCachedDashboard(data: any): void {
  set(CACHE_KEY, data, CACHE_TTL);
}

export function isDashboardCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const entry = JSON.parse(raw);
    return Date.now() < entry.expiry;
  } catch {
    return false;
  }
}

export function invalidateDashboardCache(): void {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}
