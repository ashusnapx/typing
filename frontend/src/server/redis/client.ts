import Redis from 'ioredis';

let redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('CRITICAL FATAL: REDIS_URL environment variable is missing.');
}

// Automatically resolve localhost to redis if running inside Docker Compose
if (process.env.API_URL?.includes('backend') && redisUrl.includes('localhost')) {
  redisUrl = redisUrl.replace('localhost', 'redis');
} else if (process.env.API_URL?.includes('backend') && redisUrl.includes('127.0.0.1')) {
  redisUrl = redisUrl.replace('127.0.0.1', 'redis');
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('Redis Client Connection Error:', err);
});

export default redis;
