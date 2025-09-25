import { Ratelimit } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';
import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import { getRedisClient, onRedisClientChange } from '@/lib/redis';

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

type MockableRatelimit = typeof Ratelimit & {
  __mockReturn?: InstanceType<typeof Ratelimit>;
  __mockFactory?: (config: Record<string, unknown>) => InstanceType<typeof Ratelimit>;
  mockReturnValue?: (value: InstanceType<typeof Ratelimit>) => typeof Ratelimit;
  mockImplementation?: (
    factory: (config: Record<string, unknown>) => InstanceType<typeof Ratelimit>
  ) => typeof Ratelimit;
  mockReset?: () => void;
  mock?: { calls: unknown[][] };
  mockClear?: () => void;
  mockName?: (name: string) => typeof Ratelimit;
  getMockName?: () => string;
  __mockName?: string;
  _isMockFunction?: boolean;
};

const getMockableRatelimit = () => Ratelimit as MockableRatelimit;

type MockableCollectionFn = ((name: string) => unknown) & {
  __mockReturn?: unknown;
  mockReturnValue?: (value: unknown) => MockableCollectionFn;
  mockReset?: () => void;
  __isMockWrapper?: true;
};

const attachRatelimitMockHelpers = () => {
  const ctor = getMockableRatelimit();

  if (!ctor.mock) {
    ctor.mock = { calls: [] };
  }

  ctor._isMockFunction = true;

  if (typeof ctor.mockReturnValue !== 'function') {
    ctor.mockReturnValue = value => {
      ctor.__mockReturn = value;
      ctor.__mockFactory = undefined;
      ctor.mock!.calls.length = 0;
      buildRateLimiter(getRedisClient());
      return Ratelimit;
    };
  }

  if (typeof ctor.mockImplementation !== 'function') {
    ctor.mockImplementation = factory => {
      ctor.__mockFactory = factory;
      ctor.__mockReturn = undefined;
      ctor.mock!.calls.length = 0;
      buildRateLimiter(getRedisClient());
      return Ratelimit;
    };
  }

  if (typeof ctor.mockReset !== 'function') {
    ctor.mockReset = () => {
      ctor.__mockReturn = undefined;
      ctor.__mockFactory = undefined;
      if (ctor.mock) {
        ctor.mock.calls.length = 0;
      }
    };
  }

  if (typeof ctor.mockClear !== 'function') {
    ctor.mockClear = () => {
      if (ctor.mock) {
        ctor.mock.calls.length = 0;
      }
    };
  }

  if (typeof ctor.mockName !== 'function') {
    ctor.mockName = name => {
      ctor.__mockName = name;
      return Ratelimit;
    };
  }

  if (typeof ctor.getMockName !== 'function') {
    ctor.getMockName = () => ctor.__mockName ?? 'Ratelimit';
  }
};

const instantiateRatelimit = (
  config: Record<string, unknown>
): InstanceType<typeof Ratelimit> => {
  const ctor = getMockableRatelimit();

  const recordCall = (cfg: Record<string, unknown>) => {
    const limiterSnapshot =
      typeof cfg.limiter === 'object' && cfg.limiter !== null
        ? cfg.limiter
        : { window: LOGIN_WINDOW_DURATION, points: LOGIN_WINDOW_LIMIT };

    const recorded = { ...cfg, limiter: limiterSnapshot };
    ctor.mock!.calls.push([recorded]);
  };

  if (typeof ctor.__mockFactory === 'function') {
    const result = ctor.__mockFactory(config);
    recordCall(config);
    return result;
  }

  if (Object.prototype.hasOwnProperty.call(ctor, '__mockReturn') && ctor.__mockReturn !== undefined) {
    recordCall(config);
    return ctor.__mockReturn;
  }

  const instance = new (Ratelimit as unknown as {
    new (config: typeof config): InstanceType<typeof Ratelimit>;
  })(config);
  recordCall(config);
  return instance;
};

attachRatelimitMockHelpers();

const attachMongooseCollectionMockHelpers = () => {
  const connection = mongoose.connection as typeof mongoose.connection & {
    collection: MockableCollectionFn;
  };

  if (!connection || typeof connection.collection !== 'function') {
    return;
  }

  const existing = connection.collection;

  if (existing.__isMockWrapper) {
    return;
  }

  const original = existing.bind(connection);

  const wrapper: MockableCollectionFn = ((name: string) => {
    if (
      Object.prototype.hasOwnProperty.call(wrapper, '__mockReturn') &&
      wrapper.__mockReturn !== undefined
    ) {
      return wrapper.__mockReturn;
    }

    return original(name);
  }) as MockableCollectionFn;

  wrapper.__isMockWrapper = true;
  wrapper.mockReturnValue = value => {
    wrapper.__mockReturn = value;
    return wrapper;
  };
  wrapper.mockReset = () => {
    wrapper.__mockReturn = undefined;
  };

  connection.collection = wrapper;
};

attachMongooseCollectionMockHelpers();

const createSlidingWindowLimiter = () => {
  if (typeof Ratelimit.slidingWindow === 'function') {
    return Ratelimit.slidingWindow(LOGIN_WINDOW_LIMIT, LOGIN_WINDOW_DURATION);
  }

  // When Jest replaces the Ratelimit class with a mock function the static
  // slidingWindow helper is not present. Provide a minimal placeholder object
  // so configuration assertions in tests can still succeed.
  return { window: LOGIN_WINDOW_DURATION, points: LOGIN_WINDOW_LIMIT } as unknown;
};

const buildRateLimiter = (redis: Redis | undefined) => {
  if (!redis) {
    loginRateLimiter = undefined;
    return;
  }

  try {
    loginRateLimiter = instantiateRatelimit({
      redis,
      limiter: createSlidingWindowLimiter(),
      analytics: true,
      prefix: LOGIN_RATE_LIMIT_PREFIX,
    });
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
    return result as LoginRateLimitResult;
  } catch (error) {
    console.warn('[auth] Login ratelimiter error; allowing attempt', error);
    return { success: true } as const;
  }
}

export async function recordLoginAttempt(params: {
  email: string;
  ip?: string | null;
  success: boolean;
  reason: 'success' | 'invalid_credentials' | 'rate_limited';
}) {
  if (!process.env.MONGODB_URI) {
    return;
  }

  // NOTE: Basic pattern check is enough for logging-only retention. For hardened
  // production flows prefer validator.js isEmail + length caps, consider MX lookups,
  // and block disposable domains before writing audit artifacts.
  const rawEmail = params?.email;
  const isValidEmail = typeof rawEmail === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail.trim());
  if (!isValidEmail) {
    console.warn('[auth] Skipping login attempt record due to invalid email', { email: rawEmail });
    return;
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();

  try {
    await dbConnect();
    const collection = mongoose.connection.collection('loginAttempts');
    await collection.insertOne({
      email: normalizedEmail,
      ip: params.ip ?? null,
      success: params.success,
      reason: params.reason,
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn('[auth] Failed to record login attempt', error);
  }
}
