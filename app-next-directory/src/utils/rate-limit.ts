/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter for API routes
 */

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitInfo>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitOptions {
  max: number; // Maximum requests
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (request: Request) => string; // Custom key generator
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Rate limiting function
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
    console.log('Key:', key, 'Count:', info ? info.count : 0);
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
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  // Try various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
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
