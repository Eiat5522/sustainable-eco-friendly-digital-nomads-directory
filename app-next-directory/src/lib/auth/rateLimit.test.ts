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

const mockRedisClient = {
  evalsha: jest.fn(),
  evalSha: jest.fn(),
};
const mockGetRedisClient = jest.fn(() => mockRedisClient);

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

jest.mock('@upstash/ratelimit', () => ({
  __esModule: true,
  Ratelimit: mockRatelimitClass,
}));

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  getRedisClient: mockGetRedisClient,
  onRedisClientChange: jest.fn(), // No-op for tests
}));

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

describe('rateLimit module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
    delete (globalThis as any).__TEST_LOGIN_RATE_LIMITER__;
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
      jest.resetModules(); // Isolate modules for each test in this suite
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
  });

  describe('Redis client normalization', () => {
    it('normalizes evalSha to evalsha', () => {
      const { buildRateLimiter, __getLastRateLimiterConfigForTests } = require('./rateLimit');
      const mockRedisWithEvalSha = { evalSha: jest.fn() };
      buildRateLimiter(mockRedisWithEvalSha as any);
      const config = __getLastRateLimiterConfigForTests();
      const normalizedClient = config?.redis as any;
      expect(normalizedClient).toHaveProperty('evalsha');
    });
  });
});