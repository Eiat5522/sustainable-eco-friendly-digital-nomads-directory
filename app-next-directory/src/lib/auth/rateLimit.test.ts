import { jest } from '@jest/globals';

// Mock dependencies before importing the module
const mockRatelimitClass = jest.fn();
const mockRedisClient = {
  evalsha: jest.fn(),
  evalSha: jest.fn(),
};
const mockGetRedisClient = jest.fn();
const mockOnRedisClientChange = jest.fn();
const mockDbConnect = jest.fn();
const mockMongooseConnection = {
  collection: jest.fn(),
};
const mockLoginAttemptCreate = jest.fn();
const mockValidator = {
  isEmail: jest.fn(),
  default: {
    isEmail: jest.fn(),
  },
};

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: mockRatelimitClass,
}));

jest.mock('@/lib/redis', () => ({
  getRedisClient: mockGetRedisClient,
  onRedisClientChange: mockOnRedisClientChange,
}));

jest.mock('@/lib/dbConnect', () => ({
  default: mockDbConnect,
}));

jest.mock('mongoose', () => ({
  default: {
    connection: mockMongooseConnection,
  },
}));

jest.mock('@/models/LoginAttempt', () => ({
  default: {
    create: mockLoginAttemptCreate,
  },
  LoginAttemptReason: {
    SUCCESS: 'SUCCESS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    RATE_LIMITED: 'RATE_LIMITED',
  },
}));

jest.mock('validator', () => mockValidator);

describe('rateLimit module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
    
    // Reset validator mock
    mockValidator.isEmail.mockReturnValue(true);
    mockValidator.default.isEmail.mockReturnValue(true);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('enforceLoginRateLimit', () => {
    it('returns success when no rate limiter is configured', async () => {
      mockGetRedisClient.mockReturnValue(undefined);

      const { enforceLoginRateLimit } = await import('./rateLimit');
      const result = await enforceLoginRateLimit('test@example.com');

      expect(result).toEqual({ success: true });
    });

    it('enforces rate limit when limiter is available', async () => {
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };

      mockGetRedisClient.mockReturnValue(mockRedisClient);
      mockRatelimitClass.mockReturnValue(mockLimiter);
      mockRatelimitClass.slidingWindow = jest.fn().mockReturnValue({
        limit: 5,
        window: '1 m',
      });

      const { enforceLoginRateLimit } = await import('./rateLimit');
      const result = await enforceLoginRateLimit('test@example.com');

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
    });

    it('returns rate limit exceeded response', async () => {
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: false,
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60000,
        }),
      };

      mockGetRedisClient.mockReturnValue(mockRedisClient);
      mockRatelimitClass.mockReturnValue(mockLimiter);
      mockRatelimitClass.slidingWindow = jest.fn().mockReturnValue({
        limit: 5,
        window: '1 m',
      });

      const { enforceLoginRateLimit } = await import('./rateLimit');
      const result = await enforceLoginRateLimit('test@example.com');

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('handles rate limiter errors gracefully', async () => {
      const mockLimiter = {
        limit: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
      };

      mockGetRedisClient.mockReturnValue(mockRedisClient);
      mockRatelimitClass.mockReturnValue(mockLimiter);
      mockRatelimitClass.slidingWindow = jest.fn().mockReturnValue({
        limit: 5,
        window: '1 m',
      });

      const { enforceLoginRateLimit } = await import('./rateLimit');
      const result = await enforceLoginRateLimit('test@example.com');

      expect(result).toEqual({ success: true });
    });

    it('uses test override when available', async () => {
      const mockTestLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 60000,
        }),
      };

      (globalThis as any).__TEST_LOGIN_RATE_LIMITER__ = mockTestLimiter;
      mockGetRedisClient.mockReturnValue(mockRedisClient);

      const { enforceLoginRateLimit } = await import('./rateLimit');
      const result = await enforceLoginRateLimit('test@example.com');

      expect(mockTestLimiter.limit).toHaveBeenCalledWith('test@example.com');
      expect(result.limit).toBe(10);

      delete (globalThis as any).__TEST_LOGIN_RATE_LIMITER__;
    });
  });

  describe('recordLoginAttempt', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('skips recording when MongoDB URI is not configured', async () => {
      delete process.env.MONGODB_URI;

      const { recordLoginAttempt } = await import('./rateLimit');
      await recordLoginAttempt({
        email: 'test@example.com',
        ip: '127.0.0.1',
        success: true,
        reason: 'SUCCESS' as any,
      });

      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    it('skips recording when email is invalid (not a string)', async () => {
      const { recordLoginAttempt } = await import('./rateLimit');
      await recordLoginAttempt({
        email: null as any,
        ip: '127.0.0.1',
        success: true,
        reason: 'SUCCESS' as any,
      });

      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    it('skips recording when email format is invalid', async () => {
      mockValidator.isEmail.mockReturnValue(false);
      mockValidator.default.isEmail.mockReturnValue(false);

      const { recordLoginAttempt } = await import('./rateLimit');
      await recordLoginAttempt({
        email: 'invalid-email',
        ip: '127.0.0.1',
        success: true,
        reason: 'SUCCESS' as any,
      });

      expect(mockDbConnect).not.toHaveBeenCalled();
    });

    it('records successful login attempt to MongoDB collection', async () => {
      const mockCollection = {
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc123' }),
      };
      mockMongooseConnection.collection.mockReturnValue(mockCollection);
      mockDbConnect.mockResolvedValue(undefined);
      mockValidator.isEmail.mockReturnValue(true);
      mockValidator.default.isEmail.mockReturnValue(true);

      const { recordLoginAttempt } = await import('./rateLimit');
      await recordLoginAttempt({
        email: 'Test@Example.com',
        ip: '127.0.0.1',
        success: true,
        reason: 'SUCCESS' as any,
      });

      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          ip: '127.0.0.1',
          success: true,
          reason: 'SUCCESS',
        })
      );
    });

    it('normalizes email to lowercase', async () => {
      const mockCollection = {
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc123' }),
      };
      mockMongooseConnection.collection.mockReturnValue(mockCollection);
      mockDbConnect.mockResolvedValue(undefined);

      const { recordLoginAttempt } = await import('./rateLimit');
      await recordLoginAttempt({
        email: '  UPPERCASE@EXAMPLE.COM  ',
        ip: '127.0.0.1',
        success: false,
        reason: 'INVALID_CREDENTIALS' as any,
      });

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'uppercase@example.com',
        })
      );
    });

    it('falls back to LoginAttempt model when collection insert fails', async () => {
      const mockCollection = {
        insertOne: jest.fn().mockRejectedValue(new Error('Collection error')),
      };
      mockMongooseConnection.collection.mockReturnValue(mockCollection);
      mockDbConnect.mockResolvedValue(undefined);
      mockLoginAttemptCreate.mockResolvedValue({ _id: 'abc123' });

      const { recordLoginAttempt } = await import('./rateLimit');
      await recordLoginAttempt({
        email: 'test@example.com',
        ip: '127.0.0.1',
        success: true,
        reason: 'SUCCESS' as any,
      });

      expect(mockLoginAttemptCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          ip: '127.0.0.1',
          success: true,
        })
      );
    });

    it('handles both collection and model errors gracefully', async () => {
      const mockCollection = {
        insertOne: jest.fn().mockRejectedValue(new Error('Collection error')),
      };
      mockMongooseConnection.collection.mockReturnValue(mockCollection);
      mockDbConnect.mockResolvedValue(undefined);
      mockLoginAttemptCreate.mockRejectedValue(new Error('Model error'));

      const { recordLoginAttempt } = await import('./rateLimit');
      
      // Should not throw
      await expect(
        recordLoginAttempt({
          email: 'test@example.com',
          ip: '127.0.0.1',
          success: true,
          reason: 'SUCCESS' as any,
        })
      ).resolves.not.toThrow();
    });

    it('handles database connection errors', async () => {
      mockDbConnect.mockRejectedValue(new Error('Connection failed'));

      const { recordLoginAttempt } = await import('./rateLimit');
      
      // Should not throw
      await expect(
        recordLoginAttempt({
          email: 'test@example.com',
          ip: '127.0.0.1',
          success: true,
          reason: 'SUCCESS' as any,
        })
      ).resolves.not.toThrow();
    });

    it('handles null IP address', async () => {
      const mockCollection = {
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'abc123' }),
      };
      mockMongooseConnection.collection.mockReturnValue(mockCollection);
      mockDbConnect.mockResolvedValue(undefined);

      const { recordLoginAttempt } = await import('./rateLimit');
      await recordLoginAttempt({
        email: 'test@example.com',
        ip: null,
        success: true,
        reason: 'SUCCESS' as any,
      });

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: null,
        })
      );
    });
  });

  describe('__resetLoginRateLimiterForTests', () => {
    it('resets rate limiter in test environment', async () => {
      mockGetRedisClient.mockReturnValue(mockRedisClient);

      const { __resetLoginRateLimiterForTests } = await import('./rateLimit');
      __resetLoginRateLimiterForTests();

      // Should not throw
      expect(mockGetRedisClient).toHaveBeenCalled();
    });

    it('handles rebuild errors gracefully', async () => {
      mockGetRedisClient.mockImplementation(() => {
        throw new Error('Redis error');
      });

      const { __resetLoginRateLimiterForTests } = await import('./rateLimit');
      
      // Should not throw
      expect(() => __resetLoginRateLimiterForTests()).not.toThrow();
    });
  });

  describe('__getLastRateLimiterConfigForTests', () => {
    it('returns undefined when no config has been created', async () => {
      const { __getLastRateLimiterConfigForTests } = await import('./rateLimit');
      const config = __getLastRateLimiterConfigForTests();

      expect(config).toBeUndefined();
    });

    it('returns config after rate limiter initialization', async () => {
      mockGetRedisClient.mockReturnValue(mockRedisClient);
      mockRatelimitClass.mockReturnValue({
        limit: jest.fn(),
      });
      mockRatelimitClass.slidingWindow = jest.fn().mockReturnValue({
        limit: 5,
        window: '1 m',
      });

      // Import and trigger initialization
      const { __getLastRateLimiterConfigForTests, enforceLoginRateLimit } = await import('./rateLimit');
      
      // Trigger rate limiter usage
      const mockLimiter = {
        limit: jest.fn().mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };
      (globalThis as any).__TEST_LOGIN_RATE_LIMITER__ = mockLimiter;
      
      await enforceLoginRateLimit('test@example.com');
      
      const config = __getLastRateLimiterConfigForTests();
      expect(config).toBeDefined();
      
      delete (globalThis as any).__TEST_LOGIN_RATE_LIMITER__;
    });
  });

  describe('Redis client normalization', () => {
    it('normalizes evalSha to evalsha', async () => {
      const mockRedisWithEvalSha = {
        evalSha: jest.fn(),
      };
      mockGetRedisClient.mockReturnValue(mockRedisWithEvalSha);
      mockRatelimitClass.mockReturnValue({
        limit: jest.fn().mockResolvedValue({ success: true }),
      });
      mockRatelimitClass.slidingWindow = jest.fn().mockReturnValue({
        limit: 5,
        window: '1 m',
      });

      // Re-import to trigger normalization
      await import('./rateLimit');

      // The normalization should add evalsha method
      expect(mockRedisWithEvalSha).toHaveProperty('evalsha');
    });
  });

  describe('Redis client change handler', () => {
    it('registers change handler when onRedisClientChange is available', async () => {
      mockGetRedisClient.mockReturnValue(undefined);
      mockOnRedisClientChange.mockImplementation((callback) => {
        // Simulate Redis client change
        callback(mockRedisClient);
      });

      await import('./rateLimit');

      expect(mockOnRedisClientChange).toHaveBeenCalled();
    });
  });
});
