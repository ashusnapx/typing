import { redis } from './client';

// Register Lua command for atomic token bucket evaluation
if (typeof (redis as any).consumeTokenBucket === 'undefined') {
  redis.defineCommand('consumeTokenBucket', {
    numberOfKeys: 1,
    lua: `
      local key = KEYS[1]
      local max_tokens = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local window = tonumber(ARGV[4])

      local data = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(data[1])
      local last_refill = tonumber(data[2])

      if tokens == nil then
          tokens = max_tokens
          last_refill = now
      else
          local elapsed = now - last_refill
          local fill = elapsed * refill_rate
          tokens = math.min(max_tokens, tokens + fill)
          last_refill = now
      end

      if tokens >= 1 then
          tokens = tokens - 1
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
          redis.call('EXPIRE', key, window)
          return 1
      else
          redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
          return 0
      end
    `,
  });
}

export class RateLimiter {
  static async checkLimit(params: {
    action: string;
    identifier: string;
    maxTokens: number;
    windowSeconds: number;
  }): Promise<boolean> {
    const key = `rate_limit:${params.action}:${params.identifier}`;
    const refillRate = params.maxTokens / (params.windowSeconds * 1000); // tokens/ms
    const now = Date.now();

    try {
      const result = await (redis as any).consumeTokenBucket(
        key,
        params.maxTokens,
        refillRate,
        now,
        params.windowSeconds
      );
      return result === 1;
    } catch (err) {
      console.error(`Rate limit check error for ${key}:`, err);
      // Fail open (allow request) during Redis outage to preserve availability SLO
      return true;
    }
  }
}
export default RateLimiter;
