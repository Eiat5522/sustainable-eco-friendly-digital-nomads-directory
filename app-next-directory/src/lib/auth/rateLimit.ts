import { Ratelimit } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';

import dbConnect from '@/lib/dbConnect';
import { getRedisClient, onRedisClientChange } from '@/lib/redis';
import LoginAttempt, { LoginAttemptReason } from '@/models/LoginAttempt';

type LoginRateLimitResult = {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
};

const LOGIN_WINDOW_LIMIT = 5;
const LOGIN_WINDOW_DURATION = '1 m';
const LOGIN_RATE_LIMIT_PREFIX = 'auth:login';

let loginRateLimiter: InstanceType<typeof Ratelimit> | undefined;

// NOTE: The original implementation embedded extensive Jest-style mock helper
// augmentation directly onto the Ratelimit class and mongoose connection. That
// approach mutated third‑party constructs in production bundles, increased
// bundle size, and violated separation of concerns. Test suites should instead
// rely on standard `jest.mock('@upstash/ratelimit')` patterns (already used in
// rate-limiting tests) or import a dedicated test utility if deeper behavior
// control is required. This production module now focuses solely on runtime
// functionality; no test-only mutation occurs here.

const createSlidingWindowLimiter = () => {
return Ratelimit.slidingWindow(LOGIN_WINDOW_LIMIT, LOGIN_WINDOW_DURATION);
};

const buildRateLimiter = (redis: Redis | undefined) => {
  if (!redis) {
    loginRateLimiter = undefined;
    return;
  }

  try {
    const config: {
      redis: Redis;
      limiter: unknown;
      analytics: boolean;
      prefix: string;
    } = {
      redis,
      limiter: createSlidingWindowLimiter(),
      analytics: true,
      prefix: LOGIN_RATE_LIMIT_PREFIX,
    };
    loginRateLimiter = new Ratelimit(config as any); // Upstash types may be narrower; safe cast at boundary.
  } catch (error) {
    console.warn('[auth] Failed to initialize login rate limiter', error);
    loginRateLimiter = undefined;
  }
};

buildRateLimiter(getRedisClient());

onRedisClientChange(redis => {
  buildRateLimiter(redis);
});

export async function enforceLoginRateLimit(identifier: string): Promise<LoginRateLimitResult> {
  const limiter = loginRateLimiter;

  if (!limiter) {
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
};
  } catch (error) {
    console.warn('[auth] Login ratelimiter error; allowing attempt', error);
    return { success: true } as const;
  }
}

export async function recordLoginAttempt(params: {
  email: string;
  ip?: string | null;
  success: boolean;
  reason: LoginAttemptReason;
}) {
  if (!process.env.MONGODB_URI) {
    return;
  }

  // NOTE: Basic pattern check is enough for logging-only retention. For hardened
  // production flows prefer validator.js isEmail + length caps, consider MX lookups,
  // and block disposable domains before writing audit artifacts.
  import validator from 'validator';

  const rawEmail = params?.email;
  const isValidEmail = typeof rawEmail === 'string' && validator.isEmail(rawEmail.trim());
  if (!isValidEmail) {
    console.warn('[auth] Skipping login attempt record due to invalid email', { email: rawEmail });
    return;
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();

  try {
    await dbConnect();
    await LoginAttempt.create({
      email: normalizedEmail,
      ip: params.ip ?? null,
      success: params.success,
      reason: params.reason,
    });
  } catch (error) {
    console.warn('[auth] Failed to record login attempt', error);
  }
}
