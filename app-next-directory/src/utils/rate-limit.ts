/**
 * Rate Limiting Utility
 * Uses Redis-based rate limiting via @upstash/ratelimit with in-memory fallback
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import validator from 'validator';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (fallback when Redis is not available)
const rateLimitStore = new Map<string, RateLimitInfo>();

/**
 * Manually cleanup expired rate limit entries from the in-memory store.
 * Useful for testing and periodic cleanup.
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  rateLimitStore.forEach((info, key) => {
    if (now > info.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}

// Avoid keeping a long-lived timer alive in unit tests – Jest's leak detector
// treats background intervals as open handles. Only start the cleanup loop
// outside of test environments so tests can run leak-free.
const shouldStartCleanup = process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID;
const cleanupInterval = shouldStartCleanup ? setInterval(cleanupRateLimitStore, 10 * 60 * 1000) : null;

cleanupInterval?.unref?.();

// Initialize Redis client if credentials are available
// Use undefined as initial state to allow lazy initialization check
let redis: Redis | null | undefined;

/**
 * Resets the Redis client to force re-initialization.
 * Used primarily for testing purposes.
 */
export function resetRedisClient() {
  redis = undefined;
}

/**
 * Clears the in-memory rate limit store.
 * Used primarily for testing purposes.
 */
export function clearRateLimiters() {
  rateLimitStore.clear();
}

function initializeRedis() {
  if (redis !== undefined) {
    return redis;
  }

  // Allow disabling Upstash during build/static prerender to avoid dynamic server usage.
  if (process.env.DISABLE_UPSTASH_DURING_BUILD === '1') {
    redis = null;
    return redis;
  }

  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    try {
      redis = new Redis({
        url: UPSTASH_REDIS_REST_URL,
        token: UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (_error) {
      redis = null;
    }
  } else {
    redis = null;
  }

  return redis;
}

/**
 * Configuration options for rate limiting
 */
export interface RateLimitOptions {
  max: number; // Maximum requests
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (request: Request) => string; // Custom key generator
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * In-memory rate limiting fallback
 */
function inMemoryRateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const resetTime = now + windowMs;

  // Get or create rate limit info
  let info = rateLimitStore.get(key);

  if (!info || now > info.resetTime) {
    // Create new or reset expired
    info = { count: 0, resetTime };
    rateLimitStore.set(key, info);
  }
  if (info.count >= max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      resetTime: info.resetTime,
    };
  }

  // Increment count
  info.count++;

  return {
    success: true,
    limit: max,
    remaining: max - info.count,
    resetTime: info.resetTime,
  };
}

/**
 * Rate limiting function
 * Uses Redis when available, falls back to in-memory
 */
export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, keyGenerator } = options;

  // Lazy initialize Redis
  const redisClient = initializeRedis();

  // If Redis is available, create a Redis-based rate limiter
  if (redisClient) {
    const limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
      analytics: false, // Disable analytics for better performance
    });

    return async (request: Request): Promise<RateLimitResult> => {
      try {
        // Generate key for rate limiting (default to IP)
        const key = keyGenerator ? keyGenerator(request) : getClientIP(request);

        const { success, limit, remaining, reset } = await limiter.limit(key);

        return {
          success,
          limit,
          remaining,
          resetTime: reset,
        };
      } catch (_error) {
        // Fallback to in-memory on error
        const key = keyGenerator ? keyGenerator(request) : getClientIP(request);
        return inMemoryRateLimit(key, max, windowMs);
      }
    };
  }

  // In-memory fallback
  return async (request: Request): Promise<RateLimitResult> => {
    const key = keyGenerator ? keyGenerator(request) : getClientIP(request);
    return inMemoryRateLimit(key, max, windowMs);
  };
}

/**
 * Extracts the client IP address from the request headers.
 *
 * Checks multiple common headers used by proxies and load balancers:
 * - x-forwarded-for (first IP in the list)
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * @param request - The incoming HTTP request
 * @returns The client IP address, or 'unknown' if none found
 */
function getClientIP(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = (forwarded.split(',')[0] || '').trim();
    if (first && validator.isIP(first)) {
      return first;
    }
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP && validator.isIP(realIP)) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP && validator.isIP(cfConnectingIP)) {
    return cfConnectingIP;
  }

  // Fallback to a default if no IP found
  return 'unknown';
}

/**
 * Predefined rate limiters
 */
export const rateLimiters = {
  // Contact form: 5 requests per 15 minutes
  contactForm: rateLimit({
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // API general: 100 requests per hour
  apiGeneral: rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),

  // Search: 50 requests per 10 minutes
  search: rateLimit({
    max: 50,
    windowMs: 10 * 60 * 1000, // 10 minutes
  }),
};

export { rateLimitStore };
export default rateLimit;
