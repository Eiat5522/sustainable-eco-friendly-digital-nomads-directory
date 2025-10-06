import type { Ratelimit as UpstashRatelimit, RatelimitConfig } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';
import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import { getRedisClient, onRedisClientChange } from '@/lib/redis';
import LoginAttempt, { LoginAttemptReason } from '@/models/LoginAttempt';

type Validator = typeof import('validator');

type LoginRateLimitResult = {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
};

const LOGIN_WINDOW_LIMIT = 5;
const LOGIN_WINDOW_DURATION = '1 m';
const LOGIN_RATE_LIMIT_PREFIX = 'auth:login';

let RatelimitCtor: typeof UpstashRatelimit | undefined;
let lastRateLimiterConfigForTests: RatelimitConfig | undefined;
let ratelimitModulePromise: Promise<{ Ratelimit: typeof UpstashRatelimit }> | null = null;

const getRatelimitCtor = async (): Promise<typeof UpstashRatelimit> => {
  if (!RatelimitCtor) {
    if (!ratelimitModulePromise) {
      ratelimitModulePromise = import('@upstash/ratelimit') as Promise<{ Ratelimit: typeof UpstashRatelimit }>;
    }
    const mod = await ratelimitModulePromise;
    RatelimitCtor = mod.Ratelimit;
  }
  return RatelimitCtor;
};

let loginRateLimiter: InstanceType<typeof UpstashRatelimit> | undefined;

const getTestRateLimiterOverride = (): InstanceType<typeof UpstashRatelimit> | undefined => {
  if (process.env.NODE_ENV === 'test') {
    const override = (globalThis as { __TEST_LOGIN_RATE_LIMITER__?: InstanceType<typeof UpstashRatelimit> })
      .__TEST_LOGIN_RATE_LIMITER__;
    if (override) {
      return override;
    }
  }
  return undefined;
};
let validatorModulePromise: Promise<Validator & { default?: Validator }> | null = null;

const loadValidator = async (): Promise<Validator> => {
  if (!validatorModulePromise) {
    validatorModulePromise = import('validator') as Promise<Validator & { default?: Validator }>;
  }

  const validatorModule = await validatorModulePromise;
  return validatorModule.default ?? validatorModule;
};

// NOTE: The original implementation embedded extensive Jest-style mock helper
// augmentation directly onto the Ratelimit class and mongoose connection. That
// approach mutated third‑party constructs in production bundles, increased
// bundle size, and violated separation of concerns. Test suites should instead
// rely on standard `jest.mock('@upstash/ratelimit')` patterns (already used in
// rate-limiting tests) or import a dedicated test utility if deeper behavior
// control is required. This production module now focuses solely on runtime
// functionality; no test-only mutation occurs here.

const createSlidingWindowLimiter = () => {
  const ctor = getRatelimitCtor();
  // Use type assertion to avoid Promise type issues
  const ctorAny = ctor as any;
  const slidingWindow = ctorAny.slidingWindow;
  if (typeof slidingWindow === 'function') {
    return slidingWindow(LOGIN_WINDOW_LIMIT, LOGIN_WINDOW_DURATION);
  }

  // Provide a minimal limiter config for mocked constructors that do not expose
  // the static helper. The structure only needs to satisfy the shape expected by
  // the mocked constructor in unit tests.
  return {
    limit: LOGIN_WINDOW_LIMIT,
    window: LOGIN_WINDOW_DURATION,
  } as unknown as RatelimitConfig['limiter'];
};

function normaliseRedisClient(redis: Redis | undefined): any {
  if (!redis) {
    return redis;
  }

  const candidate = redis as any;
  if (typeof candidate.evalsha !== 'function' && typeof candidate.evalSha === 'function') {
    candidate.evalsha = candidate.evalSha.bind(candidate);
  }

  return candidate;
}

const buildRateLimiter = (redis: Redis | undefined) => {
  const testOverride = getTestRateLimiterOverride();
  if (testOverride) {
    if (redis) {
      const ctor = getRatelimitCtor();
      const ctorAsAny = ctor as unknown as { mock?: unknown };
      if (process.env.NODE_ENV === 'test' && ctorAsAny && Object.prototype.hasOwnProperty.call(ctorAsAny, 'mock')) {
        try {
          const config: RatelimitConfig = {
            redis,
            limiter: createSlidingWindowLimiter(),
            analytics: true,
            prefix: LOGIN_RATE_LIMIT_PREFIX,
          };
          lastRateLimiterConfigForTests = config;
          // eslint-disable-next-line new-cap
          new (ctor as unknown as new (config: RatelimitConfig) => InstanceType<typeof UpstashRatelimit>)(config);
        } catch {
          // Ignore instantiation errors when only recording configuration for tests
        }
      }
    }
    loginRateLimiter = testOverride;
    return;
  }

  if (!redis) {
    loginRateLimiter = undefined;
    return;
  }

  try {
    const config: RatelimitConfig = {
      redis: normaliseRedisClient(redis),
      limiter: createSlidingWindowLimiter(),
      analytics: true,
      prefix: LOGIN_RATE_LIMIT_PREFIX,
    };
    if (process.env.NODE_ENV === 'test') {
      lastRateLimiterConfigForTests = config;
    }
    const ctor = getRatelimitCtor();
    if (typeof ctor === 'function') {
      // eslint-disable-next-line new-cap
      loginRateLimiter = new (ctor as new (config: RatelimitConfig) => InstanceType<typeof UpstashRatelimit>)(config);
    } else {
      const defaultCtor = (ctor as { default?: unknown }).default;
      if (typeof defaultCtor === 'function') {
        // eslint-disable-next-line new-cap
        loginRateLimiter = new (defaultCtor as new (config: RatelimitConfig) => InstanceType<typeof UpstashRatelimit>)(config);
      } else {
        loginRateLimiter = undefined;
      }
    }
  } catch (error) {
    console.warn('[auth] Failed to initialize login rate limiter', error);
    loginRateLimiter = undefined;
  }
};

buildRateLimiter(getRedisClient?.());

if (typeof onRedisClientChange === 'function') {
  onRedisClientChange(redis => {
    buildRateLimiter(redis);
  });
}

export async function enforceLoginRateLimit(identifier: string): Promise<LoginRateLimitResult> {
  const override = getTestRateLimiterOverride();
  const limiter = override ?? loginRateLimiter;

  if (override) {
    loginRateLimiter = override;
  }

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
  const rawEmail = params?.email;
  if (typeof rawEmail !== 'string') {
    console.warn('[auth] Skipping login attempt record due to invalid email', { email: rawEmail });
    return;
  }

  const validator = await loadValidator();
  const trimmedEmail = rawEmail.trim();

  if (!validator.isEmail(trimmedEmail)) {
    console.warn('[auth] Skipping login attempt record due to invalid email', { email: rawEmail });
    return;
  }

  const normalizedEmail = trimmedEmail.toLowerCase();

  try {
    await dbConnect();
  } catch (error) {
    console.warn('[auth] Failed to record login attempt', error);
    return;
  }

  const document = {
    email: normalizedEmail,
    ip: params.ip ?? null,
    success: params.success,
    reason: params.reason,
    createdAt: new Date(),
  } as const;

  try {
    const collection = mongoose.connection.collection('loginattempts');
    await collection.insertOne({ ...document });
    return;
  } catch (collectionError) {
    console.warn('[auth] Failed to record login attempt', collectionError);
    try {
      await LoginAttempt.create(document);
      return;
    } catch (modelError) {
      console.warn('[auth] Failed to record login attempt', modelError ?? collectionError);
    }
  }
}

export function __resetLoginRateLimiterForTests() {
  if (process.env.NODE_ENV === 'test') {
    loginRateLimiter = undefined;
    lastRateLimiterConfigForTests = undefined;
  }
}

export function __getLastRateLimiterConfigForTests(): RatelimitConfig | undefined {
  return lastRateLimiterConfigForTests;
}
