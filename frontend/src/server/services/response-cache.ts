import { RedisCache } from '../redis/cache';
import { redis } from '../redis/client';
import crypto from 'crypto';

class ResponseCacheService {
  private localCache: Map<string, { expiry: number; value: any }> = new Map();
  private static readonly LOCAL_MAX = 500;

  private static readonly TTL = {
    dashboard: 180,
    leaderboard: 120,
    analytics: 300,
    passageList: 300,
    passageRandom: 600,
    userProfile: 60,
  } as const;

  async get(key: string): Promise<any | null> {
    const redisData = await RedisCache.get<any>(this.cacheKey(key));
    if (redisData !== null) return redisData;
    return this.localGet(key);
  }

  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    await RedisCache.set(this.cacheKey(key), value, ttl);
    this.localSet(key, value, ttl);
  }

  async invalidate(key: string): Promise<void> {
    await RedisCache.del(this.cacheKey(key));
    this.localCache.delete(key);
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    let cursor = '0';
    const pattern = `rc:${prefix}*`;
    do {
      const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');

    for (const key of this.localCache.keys()) {
      if (key.startsWith(prefix)) {
        this.localCache.delete(key);
      }
    }
  }

  async getOrCompute(
    key: string,
    ttl: number,
    factory: () => Promise<any>,
  ): Promise<any> {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  makeCacheKey(...parts: string[]): string {
    return crypto.createHash('md5').update(parts.join(':')).digest('hex');
  }

  private cacheKey(key: string): string {
    return `rc:${key}`;
  }

  private localGet(key: string): any | null {
    const entry = this.localCache.get(key);
    if (!entry) return null;
    if (Date.now() < entry.expiry) return entry.value;
    this.localCache.delete(key);
    return null;
  }

  private localSet(key: string, value: any, ttl: number): void {
    this.localCache.set(key, { expiry: Date.now() + ttl * 1000, value });
    if (this.localCache.size > ResponseCacheService.LOCAL_MAX) {
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) this.localCache.delete(firstKey);
    }
  }
}

export const responseCache = new ResponseCacheService();
