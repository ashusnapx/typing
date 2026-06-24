import { redis } from '../redis/client';
import crypto from 'crypto';

class ResponseCacheService {
  async get(key: string): Promise<any | null> {
    try {
      const raw = await redis.get(`rc:${key}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    try {
      await redis.setex(`rc:${key}`, ttl, JSON.stringify(value));
    } catch {}
  }

  async invalidate(key: string): Promise<void> {
    try {
      await redis.del(`rc:${key}`);
    } catch {}
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    try {
      let cursor = '0';
      const pattern = `rc:${prefix}*`;
      do {
        const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) await redis.del(...keys);
      } while (cursor !== '0');
    } catch {}
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
}

export const responseCache = new ResponseCacheService();
