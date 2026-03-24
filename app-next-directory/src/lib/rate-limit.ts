import { Ratelimit } from '@upstash/ratelimit';
import { structuredLogger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import { extractClientIp } from '@/utils/ip';

// Login rate limiting: 5 attempts per 15 minutes
export let loginRateLimit: Ratelimit | undefined;

// API rate limiting: 100 requests per minute
export let apiRateLimit: Ratelimit | undefined;

// Initialize rate limiters with Redis client
const initializeRateLimiters = () => {
  try {
    const redis = getRedisClient();

    if (redis) {
      loginRateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'),
        analytics: true,
        prefix: 'ratelimit:login',
      });

      apiRateLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
        prefix: 'ratelimit:api',
      });
    }
  } catch (error) {
    structuredLogger.warn('[rate-limit] Failed to initialize rate limiters', error, {
      component: 'rate-limit',
    });
  }
};

// Initialize on module load
initializeRateLimiters();

/**
 * Helper to get client IP from request using the centralized utility.
 */
export const getClientIp = (req: Request): string => {
  return extractClientIp(req);
};

/**
 * Helper to check if a key is rate limited.
 */
export const isRateLimited = async (key: string, _limit = 10, _windowSec = 60): Promise<boolean> => {
  const limiter = apiRateLimit;
  if (!limiter) {
    // Fallback: allow request if Redis is not available
    return false;
  }

  try {
    const { success } = await limiter.limit(key);
    return !success;
  } catch (error) {
    structuredLogger.warn('[rate-limit] Error checking rate limit', error, {
      component: 'rate-limit',
    });
    // On error, allow the request to proceed
    return false;
  }
};

/**
 * Helper to get the retry-after duration in milliseconds.
 */
export const getRetryAfterMs = async (key: string): Promise<number> => {
  const limiter = apiRateLimit;
  if (!limiter) {
    return 0;
  }

  try {
    const result = await limiter.limit(key);
    if (result.reset) {
      return Math.max(0, result.reset - Date.now());
    }
    return 0;
  } catch (error) {
    structuredLogger.warn('[rate-limit] Error getting retry after', error, {
      component: 'rate-limit',
    });
    return 0;
  }
};
