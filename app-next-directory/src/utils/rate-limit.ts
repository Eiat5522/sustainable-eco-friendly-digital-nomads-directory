/**
 * Redis-backed rate limiting utility with in-memory fallback.
 *
 * Uses Upstash Redis (via REST client) when available to persist counters across
 * deployments and processes. Falls back to an in-memory Map when Redis is
 * unavailable so that local development and tests still work.
 */

import type { RedisLike } from '@/lib/redis';
import { getRedisClient } from '@/lib/redis';

export interface RateLimitOptions {
  max: number; // Maximum requests allowed in the window
  windowMs: number; // Duration of the window in milliseconds
  keyGenerator?: (request: Request) => string; // Optional custom key builder
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_PREFIX = 'rate-limit';

// In-memory store for fallback mode
const rateLimitStore = new Map<string, RateLimitInfo>();

// Clean up expired entries every 10 minutes in the fallback store
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);
cleanupInterval.unref?.();

const getClientIP = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const [first] = forwarded.split(',');
    if (first) {
      return first.trim();
    }
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
};

const redisRateLimit = async (
  redis: RedisLike,
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> => {
  const ttlSeconds = Math.ceil(windowMs / 1000);
  const redisKey = `${RATE_LIMIT_PREFIX}:${key}:${windowMs}`;

  const count = await redis.incr(redisKey);

  if (count === 1) {
    // First hit in the window – start the expiration timer.
    await redis.expire(redisKey, ttlSeconds);
  }

  const remaining = Math.max(0, max - count);

  return {
    success: count <= max,
    limit: max,
    remaining,
    // We do not have millisecond-precise TTL from Upstash here, so approximate
    // using the configured window length.
    resetTime: Date.now() + windowMs,
  };
};

const inMemoryRateLimit = (key: string, max: number, windowMs: number): RateLimitResult => {
  const now = Date.now();
  const resetTime = now + windowMs;

  const info = rateLimitStore.get(key);
  const activeInfo = !info || now > info.resetTime ? { count: 0, resetTime } : info;

  if (!info || now > info.resetTime) {
    rateLimitStore.set(key, activeInfo);
  }

  if (activeInfo.count >= max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      resetTime: activeInfo.resetTime,
    };
  }

  activeInfo.count += 1;

  return {
    success: true,
    limit: max,
    remaining: max - activeInfo.count,
    resetTime: activeInfo.resetTime,
  };
};

/**
 * Creates a limiter function. When Redis is available, counters are stored in
 * Redis so they persist across processes and deployments. Otherwise we fall
 * back to an in-memory store.
 */
export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, keyGenerator } = options;
  const redisClient = getRedisClient();

  return async (request: Request): Promise<RateLimitResult> => {
    const key = keyGenerator ? keyGenerator(request) : getClientIP(request);

    if (redisClient) {
      try {
        return await redisRateLimit(redisClient, key, max, windowMs);
      } catch (error) {
        console.warn('[rate-limit] Redis error, falling back to in-memory:', error);
      }
    }

    return inMemoryRateLimit(key, max, windowMs);
  };
}

/**
 * Pre-configured limiters used across the app.
 */
export const rateLimiters = {
  contactForm: rateLimit({
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),
  apiGeneral: rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),
  search: rateLimit({
    max: 50,
    windowMs: 10 * 60 * 1000, // 10 minutes
  }),
};

export { getClientIP, inMemoryRateLimit, rateLimitStore };
export default rateLimit;
