/**
 * Rate Limiting Utility
 * 
 * Provides in-memory rate limiting functionality for API routes.
 * Tracks request counts per client (identified by IP address) and enforces
 * configurable limits within specified time windows.
 * 
 * @example
 * ```typescript
 * const limiter = rateLimit({ max: 100, windowMs: 60 * 60 * 1000 });
 * const result = limiter(request);
 * if (!result.success) {
 *   return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
 * }
 * ```
 */

/**
 * Information about a client's rate limit status
 */
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitInfo>();

// Clean up expired entries every 10 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

cleanupInterval.unref?.();

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
 * Creates a rate limiter function with the specified options.
 * 
 * The rate limiter tracks requests per client (identified by IP or custom key)
 * and returns whether the request is allowed or has exceeded the limit.
 * 
 * @param options - Configuration for the rate limiter
 * @param options.max - Maximum number of requests allowed in the time window
 * @param options.windowMs - Time window in milliseconds
 * @param options.keyGenerator - Optional function to generate custom client keys (defaults to IP-based)
 * 
 * @returns A function that checks if a request should be rate limited
 * 
 * @example
 * ```typescript
 * const limiter = rateLimit({ max: 100, windowMs: 60 * 60 * 1000 });
 * 
 * export async function POST(request: Request) {
 *   const result = limiter(request);
 *   if (!result.success) {
 *     return Response.json(
 *       { error: 'Too many requests' },
 *       { 
 *         status: 429,
 *         headers: {
 *           'X-RateLimit-Limit': result.limit.toString(),
 *           'X-RateLimit-Remaining': result.remaining.toString(),
 *           'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
 *         }
 *       }
 *     );
 *   }
 *   // Process request...
 * }
 * ```
 */
export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, keyGenerator } = options;

  return (request: Request): RateLimitResult => {
    // Generate key for rate limiting (default to IP)
    const key = keyGenerator ? keyGenerator(request) : getClientIP(request);

    const now = Date.now();
    const resetTime = now + windowMs;

    // Get or create rate limit info
    let info = rateLimitStore.get(key);

    if (!info || now > info.resetTime) {
      // Create new or reset expired
      info = { count: 0, resetTime };
      rateLimitStore.set(key, info);
    }

    // Check if limit exceeded
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
