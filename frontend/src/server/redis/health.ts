import { redis } from './client';

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const ping = await redis.ping();
    return ping === 'PONG';
  } catch {
    return false;
  }
}
