import { describe, it, expect, afterEach, vi } from 'vitest';
import { redisConfigured } from './client';

const original = { url: process.env.REDIS_URL, env: process.env.NODE_ENV };
const set = (url: string | undefined, env: string) => {
  if (url === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = url;
  vi.stubEnv('NODE_ENV', env);
};

afterEach(() => {
  vi.unstubAllEnvs();
  if (original.url === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = original.url;
});

describe('whether there is a Redis worth talking to', () => {
  it('says no when none is configured', () => {
    set(undefined, 'production');
    expect(redisConfigured()).toBe(false);
  });

  it('says no to an address inside the function itself', () => {
    // Production has had REDIS_URL pointed at 127.0.0.1 — a Redis that exists
    // on a developer's machine and nowhere else. Every cache read then worked
    // through ten retries before giving up, on the request path, for a cache
    // that was never going to answer.
    for (const url of [
      'redis://127.0.0.1:6379/0',
      'redis://localhost:6379',
      'redis://user:pw@localhost:6379/1',
      'redis://[::1]:6379',
    ]) {
      set(url, 'production');
      expect(redisConfigured(), url).toBe(false);
    }
  });

  it('says yes to a real one', () => {
    for (const url of [
      'rediss://default:token@fine-mammal-12345.upstash.io:6379',
      'redis://10.0.0.4:6379',
      'redis://cache.internal:6379',
    ]) {
      set(url, 'production');
      expect(redisConfigured(), url).toBe(true);
    }
  });

  it('leaves a developer their local Redis', () => {
    set('redis://127.0.0.1:6379', 'development');
    expect(redisConfigured()).toBe(true);
  });
});
