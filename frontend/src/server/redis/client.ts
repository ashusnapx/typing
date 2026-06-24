import Redis from 'ioredis';

let redisClient: Redis | undefined;

function createRedisClient(): Redis {
  let redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('CRITICAL FATAL: REDIS_URL environment variable is missing.');
  }

  if (process.env.API_URL?.includes('backend') && redisUrl.includes('localhost')) {
    redisUrl = redisUrl.replace('localhost', 'redis');
  } else if (process.env.API_URL?.includes('backend') && redisUrl.includes('127.0.0.1')) {
    redisUrl = redisUrl.replace('127.0.0.1', 'redis');
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 2000);
      return delay;
    },
  });

  client.on('error', (err) => {
    console.error('Redis Client Connection Error:', err);
  });

  return client;
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return Reflect.get(getRedis(), prop, getRedis());
  },
  set(_, prop, value) {
    Reflect.set(getRedis(), prop, value);
    return true;
  },
});

export default redis;
