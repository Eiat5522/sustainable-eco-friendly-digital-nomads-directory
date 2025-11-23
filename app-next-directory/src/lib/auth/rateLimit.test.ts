import { jest } from '@jest/globals';

type SetupOptions = {
  initialRedis?: Record<string, unknown> | undefined;
  disableSlidingWindow?: boolean;
  initialRedisError?: Error | null;
  ratelimitExportFactory?: (
    limiterInstance: Record<string, unknown>,
    limitMock: jest.Mock
  ) => { __esModule?: boolean; Ratelimit?: unknown; default?: unknown };
  preserveRatelimitShape?: boolean;
  validatorExportFactory?: (validatorIsEmail: jest.Mock) => Record<string, unknown>;
  onRedisClientChangeOverride?: unknown;
};

type SetupResult = Awaited<ReturnType<typeof setupModule>>;

const setupModule = async (options: SetupOptions = {}) => {
  jest.resetModules();

  const limit = jest.fn();
  const limiterInstance = { limit };

  const ratelimitCtor = jest.fn(() => limiterInstance);
  if (options.disableSlidingWindow) {
    delete (ratelimitCtor as Record<string, unknown>).slidingWindow;
  } else {
    (ratelimitCtor as Record<string, unknown>).slidingWindow = jest.fn(() => ({
      limit: 5,
      window: '1 m',
    }));
  }

  const getRedisClient = jest.fn(() => {
    if (options.initialRedisError) {
      throw options.initialRedisError;
    }
    return options.initialRedis;
  });
  let redisChangeHandler: ((client: Record<string, unknown> | undefined) => void) | undefined;
  const onRedisClientChangeValue =
    options.onRedisClientChangeOverride === undefined
      ? jest.fn((handler: (client: Record<string, unknown> | undefined) => void) => {
          redisChangeHandler = handler;
          return jest.fn();
        })
      : options.onRedisClientChangeOverride;

  const dbConnect = jest.fn().mockResolvedValue(undefined);
  const insertOne = jest.fn().mockResolvedValue(undefined);
  const collection = jest.fn(() => ({ insertOne }));
  const loginAttemptCreate = jest.fn().mockResolvedValue(undefined);
  const validatorIsEmail = jest.fn().mockReturnValue(true);

  const ratelimitExport = options.ratelimitExportFactory
    ? options.ratelimitExportFactory(limiterInstance as Record<string, unknown>, limit)
    : { __esModule: true, Ratelimit: ratelimitCtor };

  if (!options.preserveRatelimitShape) {
    if (!('Ratelimit' in ratelimitExport) && !('default' in ratelimitExport)) {
      (ratelimitExport as { Ratelimit: typeof ratelimitCtor }).Ratelimit = ratelimitCtor;
    }

    if (!('default' in ratelimitExport)) {
      (ratelimitExport as { default?: typeof ratelimitCtor }).default = undefined;
    }

    if (typeof (ratelimitExport as { __esModule?: boolean }).__esModule === 'undefined') {
      (ratelimitExport as { __esModule: boolean }).__esModule = true;
    }
  }

  jest.doMock('@upstash/ratelimit', () => ratelimitExport);

  jest.doMock('@/lib/redis', () => ({
    __esModule: true,
    getRedisClient,
    onRedisClientChange: onRedisClientChangeValue,
  }));

  jest.doMock('@/lib/dbConnect', () => ({
    __esModule: true,
    default: dbConnect,
  }));

  jest.doMock('mongoose', () => ({
    __esModule: true,
    default: {
      connection: {
        collection,
      },
    },
  }));

  jest.doMock('@/models/LoginAttempt', () => ({
    __esModule: true,
    default: {
      create: loginAttemptCreate,
    },
    LoginAttemptReason: {
      SUCCESS: 'SUCCESS',
      INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
      RATE_LIMITED: 'RATE_LIMITED',
    },
  }));

  const validatorExport = options.validatorExportFactory
    ? options.validatorExportFactory(validatorIsEmail)
    : {
        __esModule: true,
        default: {
          isEmail: validatorIsEmail,
        },
        isEmail: validatorIsEmail,
      };

  jest.doMock('validator', () => validatorExport);

  const rateLimitModule = await import('./rateLimit');

  return {
    module: rateLimitModule,
    mocks: {
      ratelimitCtor: (ratelimitExport as { Ratelimit?: jest.Mock }).Ratelimit ?? ratelimitCtor,
      defaultCtor: (ratelimitExport as { default?: jest.Mock }).default,
      limit,
      getRedisClient,
      onRedisClientChange: onRedisClientChangeValue,
      dbConnect,
      collection,
      insertOne,
      loginAttemptCreate,
      validatorIsEmail,
    },
    redisChangeHandler,
  } as const;
};

describe('auth rateLimit utilities', () => {
// Mock dependencies at the top
const mockRatelimitLimit = jest.fn();
const mockRatelimitClass = jest.fn().mockImplementation(() => ({
  limit: mockRatelimitLimit,
}));
mockRatelimitClass.slidingWindow = jest.fn().mockReturnValue({
  limit: 5,
  window: '1 m',
});

const ratelimitModuleMock = Object.assign(jest.fn(), {
  __esModule: true as const,
  Ratelimit: mockRatelimitClass as typeof mockRatelimitClass | undefined,
  default: undefined as unknown,
});

const mockRedisClient = {
  evalsha: jest.fn(),
  evalSha: jest.fn(),
};
const mockGetRedisClient = jest.fn(() => mockRedisClient);
const mockOnRedisClientChange = jest.fn();

const redisMockExports: {
  __esModule: true;
  getRedisClient: typeof mockGetRedisClient;
  onRedisClientChange: typeof mockOnRedisClientChange | undefined;
} = {
  __esModule: true,
  getRedisClient: mockGetRedisClient,
  onRedisClientChange: mockOnRedisClientChange,
};

const mockDbConnect = jest.fn();
const mockInsertOne = jest.fn();
const mockMongooseCollection = jest.fn(() => ({
  insertOne: mockInsertOne,
}));
const mockMongooseConnection = {
  collection: mockMongooseCollection,
};

const mockLoginAttemptCreate = jest.fn();
const mockValidatorIsEmail = jest.fn();

jest.mock('@upstash/ratelimit', () => ratelimitModuleMock);

jest.mock('@/lib/redis', () => redisMockExports);

jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: mockDbConnect,
}));

jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connection: mockMongooseConnection,
  },
}));

jest.mock('@/models/LoginAttempt', () => ({
  __esModule: true,
  default: {
    create: mockLoginAttemptCreate,
  },
  LoginAttemptReason: {
    SUCCESS: 'SUCCESS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    RATE_LIMITED: 'RATE_LIMITED',
  },
}));

jest.mock('validator', () => ({
  __esModule: true,
  isEmail: mockValidatorIsEmail,
}));

const flushRateLimiter = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('rateLimit module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test', MONGODB_URI: 'mongodb://example' };
    delete (globalThis as { __TEST_LOGIN_RATE_LIMITER__?: unknown }).__TEST_LOGIN_RATE_LIMITER__;
  });

  afterEach(() => {
    process.env = originalEnv;
    delete (globalThis as { __TEST_LOGIN_RATE_LIMITER__?: unknown }).__TEST_LOGIN_RATE_LIMITER__;
    jest.restoreAllMocks();
  });

  it('uses test override when provided and records the generated config for inspection', async () => {
    const overrideLimiter = {
      limit: jest.fn().mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 123 }),
    };
    (globalThis as { __TEST_LOGIN_RATE_LIMITER__?: unknown }).__TEST_LOGIN_RATE_LIMITER__ =
      overrideLimiter;

    const redisClient = { evalSha: jest.fn() } as unknown as Record<string, unknown>;
    const { module: rateLimitModule, mocks } = await setupModule({ initialRedis: redisClient });

    expect(mocks.getRedisClient).toHaveBeenCalled();
    const config = rateLimitModule.__getLastRateLimiterConfigForTests();
    expect(config?.redis).toEqual(
      expect.objectContaining({
        evalSha: expect.any(Function),
        evalsha: expect.any(Function),
      })
    );

    const result = await rateLimitModule.enforceLoginRateLimit('identifier');
    expect(overrideLimiter.limit).toHaveBeenCalledWith('identifier');
    expect(result).toEqual({ success: true, limit: 5, remaining: 4, reset: 123 });

    rateLimitModule.__resetLoginRateLimiterForTests();
    expect(mocks.getRedisClient).toHaveBeenCalledTimes(2);
  });

  it('treats jest worker identifiers as a test environment signal even when NODE_ENV differs', async () => {
    process.env.NODE_ENV = 'development';
    process.env.JEST_WORKER_ID = '99';

    const { module: rateLimitModule, mocks } = await setupModule({ initialRedis: { evalsha: jest.fn() } });

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: Date.now() });
    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(rateLimitModule.__getLastRateLimiterConfigForTests()).toBeDefined();
  });

  it('handles test overrides when no redis client is supplied', async () => {
    const overrideLimiter = { limit: jest.fn().mockResolvedValue({ success: true }) };
    (globalThis as { __TEST_LOGIN_RATE_LIMITER__?: unknown }).__TEST_LOGIN_RATE_LIMITER__ = overrideLimiter;

    const { module: rateLimitModule } = await setupModule({ initialRedis: undefined });

    const result = await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(result).toEqual({ success: true });
    expect(rateLimitModule.__getLastRateLimiterConfigForTests()).toBeUndefined();
  });

  it('creates a sliding window limiter when redis is available', async () => {
    const redisClient = { evalsha: jest.fn() } as unknown as Record<string, unknown>;
    const { module: rateLimitModule, mocks } = await setupModule({ initialRedis: redisClient });
    mocks.limit.mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 1,
      reset: 123,
    });

    const result = await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(result).toEqual({ success: false, limit: 5, remaining: 1, reset: 123 });
    expect(mocks.ratelimitCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        analytics: true,
        prefix: 'auth:login',
      })
    );
    expect(rateLimitModule.__getLastRateLimiterConfigForTests()?.redis).toEqual(
      expect.objectContaining({ evalsha: expect.any(Function), evalSha: expect.any(Function) })
    );
  });

  it('normalizes redis clients when binding throws', async () => {
    const evalSha = () => {};
    Object.defineProperty(evalSha, 'bind', { value: () => { throw new Error('bind failed'); } });
    const { module: rateLimitModule, mocks } = await setupModule({ initialRedis: { evalSha } as unknown as Record<string, unknown> });

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: Date.now() });
    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    const config = rateLimitModule.__getLastRateLimiterConfigForTests();
    const normalized = config?.redis as { evalsha?: unknown };
    expect(normalized?.evalsha).toBe(evalSha);
  });

  it('covers legacy evalsha normalization when binding fails', async () => {
    const evalsha = () => {};
    Object.defineProperty(evalsha, 'bind', { value: () => { throw new Error('bind failure'); } });
    const { module: rateLimitModule, redisChangeHandler, mocks } = await setupModule({ initialRedis: { evalSha: jest.fn() } });

    redisChangeHandler?.({ evalsha } as unknown as Record<string, unknown>);

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: Date.now() });
    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    const config = rateLimitModule.__getLastRateLimiterConfigForTests();
    const normalized = config?.redis as { evalSha?: unknown };
    expect(normalized?.evalSha).toBe(evalsha);
  });

  it('falls back to default limiter shape when static slidingWindow helper is missing', async () => {
    const redisClient = { evalsha: jest.fn() } as unknown as Record<string, unknown>;
    const { module: rateLimitModule, mocks } = await setupModule({ initialRedis: redisClient, disableSlidingWindow: true });

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: Date.now() });

    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(rateLimitModule.__getLastRateLimiterConfigForTests()?.limiter).toEqual(
      expect.objectContaining({ limit: 5, window: '1 m' })
    );
  });

  it('initializes the limiter using default export constructors when available', async () => {
    const defaultCtor = jest.fn();
    const { module: rateLimitModule, mocks } = await setupModule({
      initialRedis: { evalsha: jest.fn() } as unknown as Record<string, unknown>,
      ratelimitExportFactory: (_instance, limitMock) => {
        defaultCtor.mockImplementation(() => ({ limit: limitMock }));
        return { __esModule: true, Ratelimit: { default: defaultCtor }, default: defaultCtor };
      },
    });

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() });
    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(mocks.defaultCtor).toBe(defaultCtor);
    expect(defaultCtor).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'auth:login' })
    );
  });

  it('initializes the limiter when only a default export is provided', async () => {
    const defaultCtor = jest.fn();
    const { module: rateLimitModule, mocks } = await setupModule({
      initialRedis: { evalsha: jest.fn() } as unknown as Record<string, unknown>,
      preserveRatelimitShape: true,
      ratelimitExportFactory: (_instance, limitMock) => {
        defaultCtor.mockImplementation(() => ({ limit: limitMock }));
        return { __esModule: true, default: defaultCtor } as Record<string, unknown>;
      },
    });

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: Date.now() });
    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(defaultCtor).toHaveBeenCalled();
  });

  it('initializes the limiter when the module itself is the constructor', async () => {
    const directCtor = jest.fn(() => {});
    const { module: rateLimitModule, mocks } = await setupModule({
      initialRedis: { evalsha: jest.fn() } as unknown as Record<string, unknown>,
      preserveRatelimitShape: true,
      ratelimitExportFactory: (_instance, limitMock) => {
        directCtor.mockImplementation(() => ({ limit: limitMock }));
        return Object.assign(directCtor, { __esModule: false }) as unknown as Record<string, unknown>;
      },
    });

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: Date.now() });
    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(directCtor).toHaveBeenCalled();
  });

  it('disables the limiter when exports provide no constructors', async () => {
    const { module: rateLimitModule, mocks } = await setupModule({
      initialRedis: { evalsha: jest.fn() } as unknown as Record<string, unknown>,
      ratelimitExportFactory: () => ({
        __esModule: true,
        Ratelimit: { default: 'unavailable' },
      }),
    });

    const result = await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(result).toEqual({ success: true });
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it('skips test-only helpers when running outside the test environment', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JEST_WORKER_ID;

    const { module: rateLimitModule, mocks } = await setupModule({ initialRedis: { evalsha: jest.fn() } });

    mocks.limit.mockResolvedValue({ success: true, limit: 5, remaining: 5, reset: Date.now() });
    await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(rateLimitModule.__getLastRateLimiterConfigForTests()).toBeUndefined();

    rateLimitModule.__resetLoginRateLimiterForTests();
    expect(mocks.getRedisClient).toHaveBeenCalledTimes(1);
  });

  it('allows login attempts when no limiter is available or when errors occur', async () => {
    const { module: rateLimitModule } = await setupModule({ initialRedis: undefined });

    const allowed = await rateLimitModule.enforceLoginRateLimit('user@example.com');
    expect(allowed).toEqual({ success: true });

    const redisClient = { evalsha: jest.fn() } as unknown as Record<string, unknown>;
    const { module: withLimiter, mocks } = await setupModule({ initialRedis: redisClient });
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    mocks.limit.mockRejectedValue(new Error('boom'));
    const fallback = await withLimiter.enforceLoginRateLimit('user@example.com');
    expect(fallback).toEqual({ success: true });
    expect(consoleSpy).toHaveBeenCalledWith(
      '[auth] Login ratelimiter error; allowing attempt',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('warns when redis client cannot be obtained during initialization', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await setupModule({ initialRedisError: new Error('redis down') });
    expect(warnSpy).toHaveBeenCalledWith(
      '[auth] Failed to obtain Redis client during initialization',
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it('warns when redis change handler encounters normalization errors', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { redisChangeHandler } = await setupModule({ initialRedis: undefined });
    warnSpy.mockClear();

    const problematicClient: Record<string, unknown> = {};
    Object.defineProperty(problematicClient, 'evalSha', {
      get() {
        throw new Error('broken getter');
      },
    });

    redisChangeHandler?.(problematicClient);

    expect(warnSpy).toHaveBeenCalledWith(
      '[auth] Failed to rebuild login rate limiter',
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it('ignores redis change notifications when the client is missing', async () => {
    const { redisChangeHandler } = await setupModule({
      initialRedis: { evalsha: jest.fn() } as unknown as Record<string, unknown>,
    });

    expect(() => redisChangeHandler?.(undefined)).not.toThrow();
  });

  it('skips redis change handler registration when the callback is unavailable', async () => {
    const { redisChangeHandler, mocks } = await setupModule({
      initialRedis: undefined,
      onRedisClientChangeOverride: null,
    });

    expect(redisChangeHandler).toBeUndefined();
    expect(mocks.onRedisClientChange).toBeNull();
  });

  it('clears stored config when limiter construction fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ctorError = new Error('constructor failure');
    const failingCtor = jest.fn(() => {
      throw ctorError;
    });

    const { module: rateLimitModule } = await setupModule({
      initialRedis: { evalsha: jest.fn() } as unknown as Record<string, unknown>,
      ratelimitExportFactory: () => ({ __esModule: true, Ratelimit: failingCtor }),
    });

    const result = await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(result).toEqual({ success: true });
    expect(rateLimitModule.__getLastRateLimiterConfigForTests()).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith('[auth] Failed to initialize login rate limiter', ctorError);

    warnSpy.mockRestore();
  });

  it('logs initialization rejections while allowing login attempts', async () => {
    const ctorError = new Error('constructor failure');
    const warnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementationOnce(() => {
        throw ctorError;
      })
      .mockImplementation(() => undefined);

    const failingCtor = jest.fn(() => {
      throw ctorError;
    });

    const { module: rateLimitModule } = await setupModule({
      initialRedis: { evalsha: jest.fn() } as unknown as Record<string, unknown>,
      ratelimitExportFactory: () => ({ __esModule: true, Ratelimit: failingCtor }),
    });

    const result = await rateLimitModule.enforceLoginRateLimit('user@example.com');

    expect(result).toEqual({ success: true });
    expect(warnSpy).toHaveBeenCalledWith(
      '[auth] Login ratelimiter initialisation error; allowing attempt',
      ctorError
    );

    warnSpy.mockRestore();
  });

  describe('recordLoginAttempt', () => {
    const baseParams = {
      email: 'example@test.dev',
      ip: '127.0.0.1',
      success: false,
      reason: 'INVALID_CREDENTIALS' as const,
    };

    const loadRecorder = async (options?: SetupOptions): Promise<SetupResult> => {
      const setup = await setupModule({ initialRedis: undefined, ...(options ?? {}) });
      setup.mocks.limit.mockResolvedValue({ success: true });
      return setup;
    };

    it('skips logging when MongoDB is disabled', async () => {
      delete process.env.MONGODB_URI;
      const { module: rateLimitModule, mocks } = await loadRecorder();
      await rateLimitModule.recordLoginAttempt(baseParams);
      expect(mocks.dbConnect).not.toHaveBeenCalled();
    });

    it('skips invalid email addresses', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder();
      mocks.validatorIsEmail.mockReturnValue(false);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      await rateLimitModule.recordLoginAttempt({ ...baseParams, email: 'not-an-email' });

      expect(mocks.dbConnect).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        '[auth] Skipping login attempt record due to invalid email',
        { email: 'not-an-email' }
      );

      warnSpy.mockRestore();
    });

    it('skips records when email parameter is not a string', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      await rateLimitModule.recordLoginAttempt({ ...baseParams, email: null as unknown as string });

      expect(mocks.dbConnect).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        '[auth] Skipping login attempt record due to invalid email',
        { email: null }
      );

      warnSpy.mockRestore();
    });

    it('uses the named validator export when no default export exists', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder({
        validatorExportFactory: (validatorIsEmail) => ({
          __esModule: true,
          isEmail: validatorIsEmail,
        }),
      });

      await rateLimitModule.recordLoginAttempt(baseParams);

      expect(mocks.validatorIsEmail).toHaveBeenCalledWith('example@test.dev');
    });

    it('logs attempts using collection insert and falls back to model create on failure', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder();
      const insertError = new Error('insert failed');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      mocks.collection.mockReturnValueOnce({ insertOne: mocks.insertOne });
      mocks.collection.mockReturnValueOnce({ insertOne: jest.fn().mockRejectedValue(insertError) });

      await rateLimitModule.recordLoginAttempt(baseParams);
      expect(mocks.dbConnect).toHaveBeenCalled();
      expect(mocks.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'example@test.dev', ip: '127.0.0.1' })
      );

      await rateLimitModule.recordLoginAttempt(baseParams);
      expect(warnSpy).toHaveBeenCalledWith('[auth] Failed to record login attempt', insertError);
      expect(mocks.loginAttemptCreate).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('records login attempts with null ip addresses when undefined', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder();

      await rateLimitModule.recordLoginAttempt({ ...baseParams, ip: undefined });

      expect(mocks.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ ip: null })
      );
    });

    it('warns when both collection insert and model fallback fail', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder();
      const insertError = new Error('insert failed');
      const modelError = new Error('model failed');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      mocks.collection.mockReturnValueOnce({ insertOne: jest.fn().mockRejectedValue(insertError) });
      mocks.loginAttemptCreate.mockRejectedValue(modelError);

      await rateLimitModule.recordLoginAttempt(baseParams);

      expect(warnSpy).toHaveBeenCalledWith('[auth] Failed to record login attempt', modelError);

      warnSpy.mockRestore();
    });

    it('handles database connection failures gracefully', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder();
      const error = new Error('connection failed');
      mocks.dbConnect.mockRejectedValue(error);
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      await rateLimitModule.recordLoginAttempt(baseParams);

      expect(warnSpy).toHaveBeenCalledWith('[auth] Failed to record login attempt', error);
      warnSpy.mockRestore();
    });

    it('logs collection errors when the model rejection lacks details', async () => {
      const { module: rateLimitModule, mocks } = await loadRecorder();
      const insertError = new Error('insert failed');
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      mocks.collection.mockReturnValueOnce({ insertOne: jest.fn().mockRejectedValue(insertError) });
      mocks.loginAttemptCreate.mockRejectedValue(undefined);

      await rateLimitModule.recordLoginAttempt(baseParams);

      expect(warnSpy).toHaveBeenCalledWith('[auth] Failed to record login attempt', insertError);

      warnSpy.mockRestore();
    });
  });
});
});
