import { redis } from './client';

export class RedisCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, data);
    } catch (err) {
      console.error(`Failed to cache key ${key}:`, err);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      console.error(`Failed to delete key ${key}:`, err);
    }
  }
}
export default RedisCache;
