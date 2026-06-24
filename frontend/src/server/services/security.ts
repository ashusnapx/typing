import crypto from 'crypto';
import { redis } from '../redis/client';

export class SecurityService {
  async blacklistToken(jti: string, expirySeconds: number): Promise<void> {
    await redis.setex(`bl:${jti}`, Math.max(1, expirySeconds), '1');
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await redis.exists(`bl:${jti}`);
    return result > 0;
  }

  async checkRate(
    identifier: string,
    endpoint: string,
    maxAttempts: number = 5,
    windowSeconds: number = 60,
    lockoutMinutes: number = 15,
  ): Promise<{ allowed: boolean; retryAfter: number | null }> {
    const key = `rl:${identifier}:${endpoint}`;
    const lockKey = `lock:${identifier}:${endpoint}`;

    const lockTtl = await redis.ttl(lockKey);
    if (lockTtl > 0) {
      return { allowed: false, retryAfter: lockTtl };
    }

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (count > maxAttempts) {
      await redis.setex(lockKey, lockoutMinutes * 60, '1');
      await redis.del(key);
      return { allowed: false, retryAfter: lockoutMinutes * 60 };
    }

    return { allowed: true, retryAfter: null };
  }

  async resetRate(identifier: string, endpoint: string): Promise<void> {
    await redis.del(`rl:${identifier}:${endpoint}`);
    await redis.del(`lock:${identifier}:${endpoint}`);
  }

  async storeRefreshToken(tokenHash: string, userId: string, ttl: number): Promise<void> {
    await redis.setex(`rt:${tokenHash}`, ttl, userId);
  }

  async consumeRefreshToken(tokenHash: string): Promise<string | null> {
    const userId = await redis.get(`rt:${tokenHash}`);
    if (userId) {
      await redis.del(`rt:${tokenHash}`);
      return userId;
    }
    return null;
  }

  async recordFailedLogin(userId: string): Promise<number> {
    const key = `fal:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 30 * 60);
    }
    return count;
  }

  async resetFailedLogins(userId: string): Promise<void> {
    await redis.del(`fal:${userId}`);
  }
}

export const securityService = new SecurityService();

export function calculatePasswordEntropy(password: string): number {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/\d/.test(password)) charsetSize += 10;
  if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) charsetSize += 32;
  if (charsetSize === 0) return 0;
  return password.length * Math.log2(charsetSize);
}

export function validatePasswordStrength(password: string | null): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (password.length > 128) return 'Password must be at most 128 characters';
  return null;
}

export function sanitizeInput(value: string, maxLength: number = 1000): string {
  return value.trim().slice(0, maxLength).replace(/[<>'"]/g, '');
}

export function generateSecureJti(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
