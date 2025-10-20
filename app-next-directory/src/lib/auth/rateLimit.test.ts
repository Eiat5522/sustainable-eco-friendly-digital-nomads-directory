import { jest } from '@jest/globals';

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
    ratelimitModuleMock.mockReset();
    ratelimitModuleMock.Ratelimit = mockRatelimitClass;
    delete ratelimitModuleMock.default;
    ratelimitModuleMock.__esModule = true;
    redisMockExports.onRedisClientChange = mockOnRedisClientChange;
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
    delete (globalThis as any).__TEST_LOGIN_RATE_LIMITER__;
    ratelimitModuleMock.Ratelimit = mockRatelimitClass;
    delete ratelimitModuleMock.default;
    redisMockExports.onRedisClientChange = mockOnRedisClientChange;
  });

  describe('enforceLoginRateLimit', () => {
    let enforceLoginRateLimit: any, buildRateLimiter: any;

    beforeEach(() => {
      const rateLimitModule = require('./rateLimit');
      enforceLoginRateLimit = rateLimitModule.enforceLoginRateLimit;
      buildRateLimiter = rateLimitModule.buildRateLimiter;
      buildRateLimiter(mockGetRedisClient() as any);
    });

    it('returns success when no rate limiter is configured', async () => {
      buildRateLimiter(undefined);
      const result = await enforceLoginRateLimit('test@example.com');
      expect(result).toEqual({ success: true });
    });

    it('enforces rate limit when limiter is available', async () => {
      mockRatelimitLimit.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
        reset: Date.now() + 60000,
      });

      const result = await enforceLoginRateLimit('test@example.com');

      expect(mockRatelimitLimit).toHaveBeenCalledWith('test@example.com');
      expect(result.success).toBe(true);
    });

    it('handles rate limiter errors gracefully', async () => {
      mockRatelimitLimit.mockRejectedValue(new Error('Redis connection failed'));
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await enforceLoginRateLimit('test@example.com');

      expect(result).toEqual({ success: true });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Login ratelimiter error'),
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('recordLoginAttempt', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('skips recording when MongoDB URI is not configured', async () => {
      delete process.env.MONGODB_URI;
      const { recordLoginAttempt } = require('./rateLimit');
      const { default: dbConnect } = require('@/lib/dbConnect');
      await recordLoginAttempt({ email: 'test@example.com', ip: '127.0.0.1', success: true, reason: 'SUCCESS' as any });
      expect(dbConnect).not.toHaveBeenCalled();
    });

    it('skips recording when email is invalid', async () => {
      const { isEmail } = require('validator');
      isEmail.mockReturnValue(false);
      const { recordLoginAttempt } = require('./rateLimit');
      const { default: dbConnect } = require('@/lib/dbConnect');
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await recordLoginAttempt({ email: 'invalid', ip: '127.0.0.1', success: true, reason: 'SUCCESS' as any });

      expect(dbConnect).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid email'), { email: 'invalid' });
      consoleWarnSpy.mockRestore();
    });

    it('records successful login attempt', async () => {
      const { isEmail } = require('validator');
      isEmail.mockReturnValue(true);
      const { default: dbConnect } = require('@/lib/dbConnect');
      dbConnect.mockResolvedValue(true);
      const { default: mongoose } = require('mongoose');
      const insertOneMock = jest.fn().mockResolvedValue({ insertedId: 'abc123' });
      mongoose.connection.collection.mockReturnValue({ insertOne: insertOneMock });

      const { recordLoginAttempt } = require('./rateLimit');
      await recordLoginAttempt({ email: 'test@example.com', ip: '127.0.0.1', success: true, reason: 'SUCCESS' as any });

      expect(dbConnect).toHaveBeenCalled();
      expect(insertOneMock).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
    });

    it('falls back to model when collection insert fails', async () => {
      const { isEmail } = require('validator');
      isEmail.mockReturnValue(true);
      const { default: dbConnect } = require('@/lib/dbConnect');
      dbConnect.mockResolvedValue(true);
      const { default: mongoose } = require('mongoose');
      const collectionError = new Error('Collection error');
      mongoose.connection.collection.mockReturnValue({ insertOne: jest.fn().mockRejectedValue(collectionError) });
      const { default: LoginAttempt } = require('@/models/LoginAttempt');
      LoginAttempt.create.mockResolvedValue({ _id: 'abc123' });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { recordLoginAttempt } = require('./rateLimit');
      await recordLoginAttempt({ email: 'test@example.com', ip: '127.0.0.1', success: true, reason: 'SUCCESS' as any });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to record login attempt'), collectionError);
      expect(LoginAttempt.create).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('handles db connection errors gracefully', async () => {
      const { isEmail } = require('validator');
      isEmail.mockReturnValue(true);
      const { default: dbConnect } = require('@/lib/dbConnect');
      const connectionError = new Error('Connection failed');
      dbConnect.mockRejectedValue(connectionError);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { recordLoginAttempt } = require('./rateLimit');
      await recordLoginAttempt({ email: 'test@example.com', ip: '127.0.0.1', success: true, reason: 'SUCCESS' as any });

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to record login attempt'), connectionError);
      consoleWarnSpy.mockRestore();
    });

    it('skips when email is not a string', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { recordLoginAttempt } = require('./rateLimit');

      await recordLoginAttempt({ email: 42 as any, ip: null, success: false, reason: 'SUCCESS' as any });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('invalid email'),
        { email: 42 }
      );
      expect(mockValidatorIsEmail).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('logs when both collection and model writes fail', async () => {
      const { isEmail } = require('validator');
      isEmail.mockReturnValue(true);
      const { default: dbConnect } = require('@/lib/dbConnect');
      dbConnect.mockResolvedValue(true);
      const { default: mongoose } = require('mongoose');
      const collectionError = new Error('collection failure');
      const modelError = new Error('model failure');
      mongoose.connection.collection.mockReturnValue({
        insertOne: jest.fn().mockRejectedValue(collectionError),
      });
      const { default: LoginAttempt } = require('@/models/LoginAttempt');
      LoginAttempt.create.mockRejectedValue(modelError);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { recordLoginAttempt } = require('./rateLimit');
      await recordLoginAttempt({ email: 'test@example.com', ip: null, success: true, reason: 'SUCCESS' as any });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to record login attempt'),
        modelError
      );
      consoleWarnSpy.mockRestore();
    });

    it('reuses cached validator module across attempts', async () => {
      const { isEmail } = require('validator');
      isEmail.mockReturnValue(true);
      const { default: dbConnect } = require('@/lib/dbConnect');
      dbConnect.mockResolvedValue(true);
      const { default: mongoose } = require('mongoose');
      const insertOne = jest.fn().mockResolvedValue({ insertedId: 'first' });
      mongoose.connection.collection.mockReturnValue({ insertOne });

      const { recordLoginAttempt } = require('./rateLimit');

      await recordLoginAttempt({ email: 'user@example.com', ip: null, success: true, reason: 'SUCCESS' as any });
      await recordLoginAttempt({ email: 'user@example.com', ip: null, success: false, reason: 'SUCCESS' as any });

      expect(insertOne).toHaveBeenCalledTimes(2);
      expect(dbConnect).toHaveBeenCalledTimes(2);
    });

    it('logs collection error when model error is missing', async () => {
      const { isEmail } = require('validator');
      isEmail.mockReturnValue(true);
      const { default: dbConnect } = require('@/lib/dbConnect');
      dbConnect.mockResolvedValue(true);
      const { default: mongoose } = require('mongoose');
      const collectionError = new Error('collection failure');
      mongoose.connection.collection.mockReturnValue({ insertOne: jest.fn().mockRejectedValue(collectionError) });
      const { default: LoginAttempt } = require('@/models/LoginAttempt');
      LoginAttempt.create.mockRejectedValue(undefined);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { recordLoginAttempt } = require('./rateLimit');
      await recordLoginAttempt({ email: 'user@example.com', ip: null, success: false, reason: 'SUCCESS' as any });

      const collectionWarnings = consoleWarnSpy.mock.calls.filter(
        ([message, error]) => message.includes('Failed to record login attempt') && error === collectionError
      );
      expect(collectionWarnings.length).toBeGreaterThanOrEqual(2);
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Redis client normalization', () => {
    it('normalizes evalSha to evalsha', async () => {
      const { buildRateLimiter, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      const mockRedisWithEvalSha = { evalSha: jest.fn() };
      buildRateLimiter(mockRedisWithEvalSha as any);
      await flushRateLimiter();
      const config = __getLastRateLimiterConfigForTests();
      const normalizedClient = config?.redis as any;
      expect(normalizedClient).toHaveProperty('evalsha');
    });
  });

  describe('buildRateLimiter behavior', () => {
    it('captures rate limiter configuration when Redis is provided', async () => {
      const { buildRateLimiter, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      const redisClient = { evalsha: jest.fn() };

      buildRateLimiter(redisClient as any);
      await flushRateLimiter();

      const config = __getLastRateLimiterConfigForTests();
      expect(config).toBeDefined();
      expect(config).toMatchObject({ analytics: true, prefix: 'auth:login' });
      expect(config?.redis).toHaveProperty('evalSha');
      expect(mockRatelimitClass).toHaveBeenCalledWith(
        expect.objectContaining({ limiter: { limit: 5, window: '1 m' } })
      );
    });

    it('retains evalSha when binding fails during normalization', async () => {
      const { buildRateLimiter, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      const evalShaFn = jest.fn();
      evalShaFn.bind = () => {
        throw new Error('bind failure');
      };
      const redisClient = { evalSha: evalShaFn };

      buildRateLimiter(redisClient as any);
      await flushRateLimiter();

      const normalized = __getLastRateLimiterConfigForTests()?.redis as any;
      expect(normalized.evalsha).toBe(evalShaFn);
    });

    it('retains evalsha when rebinding back to evalSha fails', async () => {
      const { buildRateLimiter, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      const evalshaFn = jest.fn();
      evalshaFn.bind = () => {
        throw new Error('bind failure');
      };
      const redisClient = { evalsha: evalshaFn };

      buildRateLimiter(redisClient as any);
      await flushRateLimiter();

      const normalized = __getLastRateLimiterConfigForTests()?.redis as any;
      expect(normalized.evalSha).toBe(evalshaFn);
    });

    it('falls back to default limiter config when slidingWindow is unavailable', async () => {
      const originalSlidingWindow = mockRatelimitClass.slidingWindow;
      // @ts-expect-error overriding static for test coverage
      mockRatelimitClass.slidingWindow = undefined;

      const { buildRateLimiter } = require('./rateLimit');
      const redisClient = { evalsha: jest.fn() };

      buildRateLimiter(redisClient as any);
      await flushRateLimiter();

      const [configArg] = mockRatelimitClass.mock.calls[mockRatelimitClass.mock.calls.length - 1];
      expect(configArg.limiter).toEqual({ limit: 5, window: '1 m' });

      mockRatelimitClass.slidingWindow = originalSlidingWindow;
    });

    it('constructs limiter from module default export when named export is absent', async () => {
      const fallbackCtor = jest.fn().mockImplementation(() => ({ limit: mockRatelimitLimit }));
      ratelimitModuleMock.Ratelimit = undefined;
      ratelimitModuleMock.default = fallbackCtor;

      const { buildRateLimiter } = require('./rateLimit');
      const redisClient = { evalsha: jest.fn() };

      buildRateLimiter(redisClient as any);
      await flushRateLimiter();

      expect(fallbackCtor).toHaveBeenCalled();
      expect(mockRatelimitClass).not.toHaveBeenCalled();
    });

    it('constructs limiter when the module itself is callable', async () => {
      ratelimitModuleMock.Ratelimit = undefined;
      delete ratelimitModuleMock.default;
      ratelimitModuleMock.mockImplementation(() => ({ limit: mockRatelimitLimit }));

      const { buildRateLimiter, enforceLoginRateLimit } = require('./rateLimit');
      mockRatelimitLimit.mockResolvedValueOnce({ success: true });

      buildRateLimiter({ evalSha: jest.fn() } as any);
      await flushRateLimiter();

      const result = await enforceLoginRateLimit('user');
      expect(result).toEqual({ success: true });
      expect(ratelimitModuleMock).toHaveBeenCalled();
    });

    it('falls back to the default export when named constructor is missing', async () => {
      const fallbackCtor = jest.fn().mockImplementation(() => ({ limit: mockRatelimitLimit }));
      ratelimitModuleMock.Ratelimit = { default: fallbackCtor } as unknown as typeof mockRatelimitClass;
      ratelimitModuleMock.default = undefined;

      const { buildRateLimiter } = require('./rateLimit');
      const redisClient = { evalSha: jest.fn() };

      buildRateLimiter(redisClient as any);
      await flushRateLimiter();

      expect(fallbackCtor).toHaveBeenCalled();
      expect(mockRatelimitClass).not.toHaveBeenCalled();
    });

    it('respects test overrides for the login rate limiter', async () => {
      const overrideLimit = jest.fn().mockResolvedValue({ success: true });
      const override = { limit: overrideLimit } as any;
      (globalThis as any).__TEST_LOGIN_RATE_LIMITER__ = override;

      const { buildRateLimiter, enforceLoginRateLimit, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      const redisClient = { evalsha: jest.fn() };

      buildRateLimiter(redisClient as any);
      await flushRateLimiter();

      const result = await enforceLoginRateLimit('user');
      expect(result).toEqual({ success: true });
      expect(overrideLimit).toHaveBeenCalledWith('user');
      expect(mockRatelimitClass).not.toHaveBeenCalled();
      expect(__getLastRateLimiterConfigForTests()).toBeDefined();

      delete (globalThis as any).__TEST_LOGIN_RATE_LIMITER__;
    });

    it('uses overrides when no redis client is provided', async () => {
      const overrideLimit = jest.fn().mockResolvedValue({ success: true });
      (globalThis as any).__TEST_LOGIN_RATE_LIMITER__ = { limit: overrideLimit };

      const { buildRateLimiter, enforceLoginRateLimit } = require('./rateLimit');

      buildRateLimiter(undefined);
      const result = await enforceLoginRateLimit('user');

      expect(result).toEqual({ success: true });
      expect(overrideLimit).toHaveBeenCalledWith('user');

      delete (globalThis as any).__TEST_LOGIN_RATE_LIMITER__;
    });

    it('resets state for tests and rebuilds the limiter using the latest Redis client', async () => {
      const firstRedis = { evalsha: jest.fn() } as any;
      const rebuiltRedis = { evalsha: jest.fn() } as any;
      mockGetRedisClient.mockReturnValueOnce(firstRedis).mockReturnValue(rebuiltRedis);

      const {
        buildRateLimiter,
        __resetLoginRateLimiterForTests,
        __getLastRateLimiterConfigForTests,
      } = require('./rateLimit');

      await flushRateLimiter();
      const initialCalls = mockRatelimitClass.mock.calls.length;
      buildRateLimiter(firstRedis);
      await flushRateLimiter();

      expect(mockRatelimitClass).toHaveBeenCalledTimes(initialCalls + 1);
      expect(__getLastRateLimiterConfigForTests()?.redis).toHaveProperty('evalSha');

      __resetLoginRateLimiterForTests();
      await flushRateLimiter();

      expect(mockRatelimitClass).toHaveBeenCalledTimes(initialCalls + 2);
      const config = __getLastRateLimiterConfigForTests();
      expect(config?.redis).toHaveProperty('evalSha');
      expect(mockGetRedisClient).toHaveBeenCalled();
    });

    it('logs initialization failures when rate limiter instantiation throws', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockRatelimitClass.mockImplementationOnce(() => {
        throw new Error('ctor failure');
      });

      const { __getLastRateLimiterConfigForTests } = require('./rateLimit');
      await flushRateLimiter();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[auth] Failed to initialize login rate limiter',
        expect.any(Error)
      );
      expect(__getLastRateLimiterConfigForTests()).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('leaves primitive redis clients untouched during normalization', async () => {
      const { buildRateLimiter, __getLastRateLimiterConfigForTests } = require('./rateLimit');

      mockRatelimitLimit.mockResolvedValueOnce({ success: true });
      buildRateLimiter('redis-primitive' as any);
      await flushRateLimiter();

      expect(__getLastRateLimiterConfigForTests()?.redis).toBe('redis-primitive');
    });
  });

  describe('module initialization warnings', () => {
    it('warns when redis client retrieval fails during startup', () => {
      const error = new Error('client failure');
      mockGetRedisClient.mockImplementationOnce(() => {
        throw error;
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      require('./rateLimit');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[auth] Failed to obtain Redis client during initialization',
        error
      );
      consoleSpy.mockRestore();
    });

    it('warns when redis change handler throws during normalization', () => {
      const error = new Error('normalize failure');
      mockOnRedisClientChange.mockImplementationOnce((callback) => {
        callback(
          new Proxy(
            {},
            {
              get() {
                throw error;
              },
            }
          ) as any
        );
        return jest.fn();
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      require('./rateLimit');

      expect(consoleSpy).toHaveBeenCalledWith('[auth] Failed to rebuild login rate limiter', error);
      consoleSpy.mockRestore();
    });

    it('rebuilds the limiter when redis client changes successfully', async () => {
      const replacement = { evalSha: jest.fn() } as any;
      mockOnRedisClientChange.mockImplementationOnce((callback) => {
        callback(replacement);
        return jest.fn();
      });

      const { __getLastRateLimiterConfigForTests } = require('./rateLimit');
      await flushRateLimiter();

      const config = __getLastRateLimiterConfigForTests();
      expect(config?.redis).toHaveProperty('evalSha');
      expect(mockRatelimitClass).toHaveBeenCalled();
    });

    it('skips redis change subscriptions when no handler is exported', () => {
      redisMockExports.onRedisClientChange = undefined;
      jest.resetModules();

      expect(() => require('./rateLimit')).not.toThrow();
      expect(mockOnRedisClientChange).not.toHaveBeenCalled();
    });

    it('gracefully skips limiter creation when no constructor is available', async () => {
      ratelimitModuleMock.Ratelimit = { default: 'not-a-function' } as any;

      const { buildRateLimiter, enforceLoginRateLimit } = require('./rateLimit');
      buildRateLimiter({ evalSha: jest.fn() } as any);
      await flushRateLimiter();

      const result = await enforceLoginRateLimit('user');
      expect(result).toEqual({ success: true });
      expect(mockRatelimitClass).not.toHaveBeenCalled();
    });
  });

  describe('enforceLoginRateLimit warnings', () => {
    it('logs when awaiting a rejected initialization promise', async () => {
      const rejectionError = new Error('initialization failure');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const {
        enforceLoginRateLimit,
        __setLoginRateLimiterPromiseForTests,
      } = require('./rateLimit');

      const rejectingPromise = Promise.reject(rejectionError);
      rejectingPromise.catch(() => {});
      __setLoginRateLimiterPromiseForTests(rejectingPromise);

      await expect(enforceLoginRateLimit('user')).resolves.toEqual({ success: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[auth] Login ratelimiter initialisation error; allowing attempt',
        rejectionError
      );
      consoleSpy.mockRestore();
      __setLoginRateLimiterPromiseForTests(null);
    });
  });

  describe('environment detection', () => {
    it('treats jest worker id as test environment even when NODE_ENV differs', async () => {
      process.env.NODE_ENV = 'development';
      process.env.JEST_WORKER_ID = '77';
      jest.resetModules();

      const { enforceLoginRateLimit } = require('./rateLimit');
      await expect(enforceLoginRateLimit('user')).resolves.toEqual({ success: true });
    });

    it('ignores test overrides outside of test environments', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JEST_WORKER_ID;
      jest.resetModules();

      const overrideLimit = jest.fn().mockResolvedValue({ success: true });
      (globalThis as any).__TEST_LOGIN_RATE_LIMITER__ = { limit: overrideLimit };

      const { buildRateLimiter, enforceLoginRateLimit, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      const redisClient = { evalSha: jest.fn() } as any;
      mockRatelimitLimit.mockResolvedValueOnce({ success: true });

      buildRateLimiter(redisClient);
      await flushRateLimiter();

      expect(mockRatelimitClass).toHaveBeenCalled();
      expect(__getLastRateLimiterConfigForTests()).toBeUndefined();
      const result = await enforceLoginRateLimit('user@example.com');
      expect(result).toEqual({ success: true });
      expect(overrideLimit).not.toHaveBeenCalled();
    });

    it('does not retain config when initialization fails outside test mode', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JEST_WORKER_ID;
      jest.resetModules();

      mockRatelimitClass.mockImplementationOnce(() => {
        throw new Error('ctor failure');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { buildRateLimiter, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      buildRateLimiter({ evalSha: jest.fn() } as any);
      await flushRateLimiter();

      expect(consoleSpy).toHaveBeenCalledWith('[auth] Failed to initialize login rate limiter', expect.any(Error));
      expect(__getLastRateLimiterConfigForTests()).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('avoids resetting helpers when not marked as test environment', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JEST_WORKER_ID;
      jest.resetModules();

      const { __resetLoginRateLimiterForTests, __setLoginRateLimiterPromiseForTests } = require('./rateLimit');

      const pending = Promise.resolve();
      __setLoginRateLimiterPromiseForTests(pending);
      __resetLoginRateLimiterForTests();

      const { enforceLoginRateLimit } = require('./rateLimit');
      expect(enforceLoginRateLimit).toBeDefined();
    });
  });
});