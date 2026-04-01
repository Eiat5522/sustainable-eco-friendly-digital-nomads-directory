import { Ratelimit } from '@upstash/ratelimit';
import validator from 'validator';
import { structuredLogger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';

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

export let getClientIp = (req: Request): string => {
  try {
    const xf = req.headers.get('x-forwarded-for');
    if (xf) {
      const value = xf.split(',')[0] || '';
      // Handle IPv6 with port (e.g. [2001:db8::1]:8080)
      let ip = value.trim();
      if (ip.startsWith('[') && ip.includes(']')) {
        ip = ip.split(']')[0].replace('[', '');
      } else if (ip.split(':').length === 2) {
        // Handle IPv4 with port (e.g. 127.0.0.1:8080)
        ip = ip.split(':')[0];
      }

      if (ip && validator.isIP(ip)) {
        return ip;
      }
    }
    const xr = req.headers.get('x-real-ip');
    if (xr && validator.isIP(xr.trim())) return xr.trim();

    const cf = req.headers.get('cf-connecting-ip');
    if (cf && validator.isIP(cf.trim())) return cf.trim();
  } catch {}
  return 'unknown';
};

// Helper for backward compatibility
export let isRateLimited = async (key: string, _limit = 10, _windowSec = 60): Promise<boolean> => {
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

export let getRetryAfterMs = async (key: string): Promise<number> => {
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

// When running under Jest, some test files import this module before
// test setup code runs. To make the exported helpers safely mockable we
// wrap them with jest.fn when available so tests can call
// .mockReturnValue/.mockResolvedValue and use Jest matchers like
// toHaveBeenCalledWith. This preserves the original implementation for
// non-test runtimes.
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
  type JestLike = {
    fn: <T extends (...args: never[]) => unknown>(
      implementation: T
    ) => T & {
      mockImplementation?: (...args: Parameters<T>) => ReturnType<T>;
    };
  };

  const maybeJest = (globalThis as { jest?: JestLike }).jest;

  if (maybeJest) {
    const originalGetClientIp = getClientIp;
    const originalIsRateLimited = isRateLimited;
    const originalGetRetryAfterMs = getRetryAfterMs;

    getClientIp = maybeJest.fn(originalGetClientIp) as typeof getClientIp;
    isRateLimited = maybeJest.fn(originalIsRateLimited) as typeof isRateLimited;
    getRetryAfterMs = maybeJest.fn(originalGetRetryAfterMs) as typeof getRetryAfterMs;
  } else {
    structuredLogger.warn('Jest not available for mocking in rate-limit module', {
      component: 'rate-limit',
    });
  }
}
