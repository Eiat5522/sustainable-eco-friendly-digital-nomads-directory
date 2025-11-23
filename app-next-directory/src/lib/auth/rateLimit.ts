import type { Ratelimit as UpstashRatelimit, RatelimitConfig } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';
import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import { getRedisClient, onRedisClientChange } from '@/lib/redis';
import LoginAttempt, { type LoginAttemptReason } from '@/models/LoginAttempt';

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

const isTestEnvironment = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

let RatelimitCtor: typeof UpstashRatelimit | undefined;
let lastRateLimiterConfigForTests: RatelimitConfig | undefined;
let ratelimitModulePromise: Promise<{ Ratelimit: typeof UpstashRatelimit }> | null = null;

const getRatelimitCtor = async (): Promise<typeof UpstashRatelimit> => {
  if (!RatelimitCtor) {
    if (!ratelimitModulePromise) {
      ratelimitModulePromise = import('@upstash/ratelimit') as Promise<{ Ratelimit: typeof UpstashRatelimit }>;
    }
    const mod = await ratelimitModulePromise;
    RatelimitCtor = mod.Ratelimit ?? ((mod as unknown as { default?: typeof UpstashRatelimit }).default ?? (mod as unknown as typeof UpstashRatelimit));
  }
  return RatelimitCtor;
};

let loginRateLimiter: InstanceType<typeof UpstashRatelimit> | undefined;

const getTestRateLimiterOverride = (): InstanceType<typeof UpstashRatelimit> | undefined => {
  if (isTestEnvironment) {
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
// behaviour; no test-only mutation occurs here.

const createSlidingWindowLimiter = (ctor: typeof UpstashRatelimit) => {
  const maybeStatic = (ctor as unknown as { slidingWindow?: (limit: number, window: string) => RatelimitConfig['limiter'] }).slidingWindow;
  if (typeof maybeStatic === 'function') {
    return maybeStatic(LOGIN_WINDOW_LIMIT, LOGIN_WINDOW_DURATION);
  }

  return {
    limit: LOGIN_WINDOW_LIMIT,
    window: LOGIN_WINDOW_DURATION,
  } as unknown as RatelimitConfig['limiter'];
};

// Add: normalizeRedisClient helper
function normalizeRedisClient<T extends Redis | undefined>(client: T): T {
  if (!client || typeof client !== 'object') return client;

  type RedisEval = {
    evalsha?: (...args: unknown[]) => unknown;
    evalSha?: (...args: unknown[]) => unknown;
  };

  const candidate = client as Redis & RedisEval;
  const evalShaFn = candidate.evalSha;

  // Normalize evalSha -> evalsha for compatibility with Upstash Redis client.
  // The bind() call can throw in edge cases (e.g., frozen objects, proxies with
  // specific traps, or when bind is explicitly configured to throw). This is tested
  // in rateLimit.test.ts to ensure we handle such scenarios gracefully.
  if (!candidate.evalsha && typeof evalShaFn === 'function') {
    try {
      candidate.evalsha = evalShaFn.bind(candidate) as unknown as typeof candidate.evalsha;
    } catch {
      // If bind throws, use the function without binding
      candidate.evalsha = evalShaFn as unknown as typeof candidate.evalsha;
    }
  }

  const evalshaFn = candidate.evalsha;
  // Normalize evalsha -> evalSha for compatibility with standard Redis clients.
  // Same defensive handling as above for bind() potentially throwing.
  if (!candidate.evalSha && typeof evalshaFn === 'function') {
    try {
      candidate.evalSha = evalshaFn.bind(candidate) as unknown as typeof candidate.evalSha;
    } catch {
      // If bind throws, use the function without binding
      candidate.evalSha = evalshaFn as unknown as typeof candidate.evalSha;
    }
  }

  return candidate as unknown as T;
}

let loginRateLimiterPromise: Promise<void> | null = null;

export const buildRateLimiter = (redis: Redis | undefined) => {
  const testOverride = getTestRateLimiterOverride();
  if (testOverride) {
    if (redis) {
      const config: RatelimitConfig = {
        redis: normalizeRedisClient(redis),
        limiter: {
          limit: LOGIN_WINDOW_LIMIT,
          window: LOGIN_WINDOW_DURATION,
        } as unknown as RatelimitConfig['limiter'],
        analytics: true,
        prefix: LOGIN_RATE_LIMIT_PREFIX,
      };
      if (isTestEnvironment) {
        lastRateLimiterConfigForTests = config;
      }
    }
    loginRateLimiter = testOverride;
    loginRateLimiterPromise = Promise.resolve();
    return;
  }

  if (!redis) {
    loginRateLimiter = undefined;
    loginRateLimiterPromise = null;
    return;
  }

  loginRateLimiterPromise = (async () => {
    try {
      const ctor = await getRatelimitCtor();
      const config: RatelimitConfig = {
        redis: normalizeRedisClient(redis),
        limiter: createSlidingWindowLimiter(ctor),
        analytics: true,
        prefix: LOGIN_RATE_LIMIT_PREFIX,
      };

      if (isTestEnvironment) {
        lastRateLimiterConfigForTests = config;
      }

      if (typeof ctor === 'function') {
         
        loginRateLimiter = new (ctor as new (config: RatelimitConfig) => InstanceType<typeof UpstashRatelimit>)(config);
      } else {
        const defaultCtor = (ctor as unknown as { default?: unknown }).default;
        if (typeof defaultCtor === 'function') {
           
          loginRateLimiter = new (defaultCtor as new (config: RatelimitConfig) => InstanceType<typeof UpstashRatelimit>)(config);
        } else {
          loginRateLimiter = undefined;
        }
      }
    } catch (error) {
      console.warn('[auth] Failed to initialize login rate limiter', error);
      loginRateLimiter = undefined;
      if (isTestEnvironment) {
        lastRateLimiterConfigForTests = undefined;
      }
    }
  })();
};

let initialRedis: Redis | undefined;
try {
  initialRedis = getRedisClient();
} catch (error) {
  console.warn('[auth] Failed to obtain Redis client during initialization', error);
  initialRedis = undefined;
}

buildRateLimiter(initialRedis);

// Ensure handler registration uses normalization
if (typeof onRedisClientChange === 'function') {
  onRedisClientChange((newClient) => {
    try {
      const normalized = normalizeRedisClient(newClient);
      buildRateLimiter(normalized);
    } catch (error) {
      console.warn('[auth] Failed to rebuild login rate limiter', error);
    }
  });
}

export async function enforceLoginRateLimit(identifier: string): Promise<LoginRateLimitResult> {
  const override = getTestRateLimiterOverride();
  if (!override && loginRateLimiterPromise) {
    try {
      await loginRateLimiterPromise;
    } catch (error) {
      console.warn('[auth] Login ratelimiter initialisation error; allowing attempt', error);
    }
  }

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
  if (isTestEnvironment) {
    loginRateLimiter = undefined;
    lastRateLimiterConfigForTests = undefined;
    loginRateLimiterPromise = null;
    try {
      buildRateLimiter(getRedisClient());
    } catch {
      // Ignore rebuild errors in tests
    }
  }
}

export function __setLoginRateLimiterPromiseForTests(promise: Promise<void> | null) {
  if (isTestEnvironment) {
    loginRateLimiterPromise = promise;
  }
}

export function __getLastRateLimiterConfigForTests(): RatelimitConfig | undefined {
  return lastRateLimiterConfigForTests;
}
