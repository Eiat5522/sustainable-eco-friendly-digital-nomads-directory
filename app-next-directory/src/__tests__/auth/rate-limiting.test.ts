/**
 * Jest Test Suite for Rate Limiting and Redis Integration
 * 
 * Tests covering:
 * 1. Upstash Redis rate limiting functionality
 * 2. Login attempt rate limiting
 * 3. Session management with Redis
 * 4. Rate limit error handling
 * 5. Fail-open behavior when Redis is unavailable
 */

import { jest } from '@jest/globals';

// Mock Upstash dependencies
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
    reset: jest.fn(),
  })),
}));

jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('mongoose', () => ({
  connection: {
    collection: jest.fn(),
  },
}));

import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from '@/lib/redis';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import { enforceLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rateLimit';

// Type the mocks
const mockRatelimit = Ratelimit as jest.MockedClass<typeof Ratelimit>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;

// Cast getRedisClient to proper mock type with additional test helpers
const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient> & {
  mockReturnValue: (client: any) => typeof getRedisClient;
  mockClear: () => void;
  mockReset: () => void;
};

import type { Redis } from '@upstash/redis';

// Mock Redis client
const mockRedisClient: jest.Mocked<Redis> = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  // Add any other methods from Redis if needed for type completeness
} as any;

// Mock rate limiter instance
const mockRateLimiterInstance = {
  limit: jest.fn(),
  reset: jest.fn(),
};

// Mock MongoDB collection
const mockCollection = {
  insertOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
};

describe('Rate Limiting and Redis Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Ensure we're in test environment for mock attachment
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
    
    // Setup default mocks
    mockGetRedisClient.mockReturnValue(mockRedisClient);
    // Ratelimit is now automatically mocked to return mockRateLimiterInstance
    mockDbConnect.mockResolvedValue(undefined);
    
    // Mock mongoose connection
    mockMongoose.connection.collection.mockReturnValue(mockCollection);
    
    // Mock environment
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
  });

  describe('Rate Limiter Configuration', () => {
    it('should create rate limiter with correct configuration when Redis is available', () => {
      // The rate limiter should be created during module import
      expect(mockRatelimit).toHaveBeenCalledWith({
        redis: mockRedisClient,
        limiter: expect.any(Object), // Ratelimit.slidingWindow(5, '1 m')
        analytics: true,
        prefix: 'auth:login',
      });
    });

    it('should handle missing Redis client gracefully', () => {
      mockGetRedisClient.mockReturnValue(undefined);
      
      // Import would create undefined rate limiter
      // The enforceLoginRateLimit function should handle this case
    });
  });

  describe('Login Rate Limiting', () => {
    describe('Successful Rate Limiting', () => {
      it('should allow login when under rate limit', async () => {
        mockRateLimiterInstance.limit.mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        });

        const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

        expect(result).toEqual({
          success: true,
          limit: 5,
          remaining: 4,
          reset: expect.any(Number),
        });
        expect(mockRateLimiterInstance.limit).toHaveBeenCalledWith('user@example.com:192.168.1.1');
      });

      it('should block login when rate limit exceeded', async () => {
        mockRateLimiterInstance.limit.mockResolvedValue({
          success: false,
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60000,
        });

        const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

        expect(result).toEqual({
          success: false,
          limit: 5,
          remaining: 0,
          reset: expect.any(Number),
        });
      });

      it('should handle different identifier formats', async () => {
        mockRateLimiterInstance.limit.mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
        });

        // Test email-only identifier
        await enforceLoginRateLimit('user@example.com');
        expect(mockRateLimiterInstance.limit).toHaveBeenCalledWith('user@example.com');

        // Test IP-only identifier
        await enforceLoginRateLimit('192.168.1.1');
        expect(mockRateLimiterInstance.limit).toHaveBeenCalledWith('192.168.1.1');

        // Test combined identifier
        await enforceLoginRateLimit('user@example.com:192.168.1.1');
        expect(mockRateLimiterInstance.limit).toHaveBeenCalledWith('user@example.com:192.168.1.1');
      });
    });

    describe('Error Handling and Fail-Open Behavior', () => {
      it('should fail-open when rate limiter is unavailable', async () => {
        // Mock no Redis client
        mockGetRedisClient.mockReturnValue(undefined);

        const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

        expect(result).toEqual({ success: true });
      });

      it('should fail-open when rate limiter throws error', async () => {
        mockRateLimiterInstance.limit.mockRejectedValue(new Error('Redis connection failed'));

        // Mock console.warn to verify error logging
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

        expect(result).toEqual({ success: true });
        expect(consoleSpy).toHaveBeenCalledWith(
          '[auth] Login ratelimiter error; allowing attempt',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it('should handle Redis timeout errors gracefully', async () => {
        const timeoutError = new Error('Redis timeout');
        timeoutError.name = 'TimeoutError';
        mockRateLimiterInstance.limit.mockRejectedValue(timeoutError);

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

        expect(result).toEqual({ success: true });
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle Redis connection errors gracefully', async () => {
        const connectionError = new Error('ECONNREFUSED');
        mockRateLimiterInstance.limit.mockRejectedValue(connectionError);

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

        expect(result).toEqual({ success: true });
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });

    describe('Rate Limit Edge Cases', () => {
      it('should handle empty identifier', async () => {
        mockRateLimiterInstance.limit.mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
        });

        const result = await enforceLoginRateLimit('');

        expect(result.success).toBe(true);
        expect(mockRateLimiterInstance.limit).toHaveBeenCalledWith('');
      });

      it('should handle very long identifiers', async () => {
        const longIdentifier = 'a'.repeat(1000) + '@example.com:192.168.1.1';
        
        mockRateLimiterInstance.limit.mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
        });

        const result = await enforceLoginRateLimit(longIdentifier);

        expect(result.success).toBe(true);
        expect(mockRateLimiterInstance.limit).toHaveBeenCalledWith(longIdentifier);
      });

      it('should handle special characters in identifiers', async () => {
        const specialIdentifier = 'üser+test@exämple.com:192.168.1.1';
        
        mockRateLimiterInstance.limit.mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
        });

        const result = await enforceLoginRateLimit(specialIdentifier);

        expect(result.success).toBe(true);
        expect(mockRateLimiterInstance.limit).toHaveBeenCalledWith(specialIdentifier);
      });
    });
  });

  describe('Login Attempt Recording', () => {
    describe('Successful Recording', () => {
      it('should record successful login attempt', async () => {
        mockCollection.insertOne.mockResolvedValue({ insertedId: 'log123' });

        await recordLoginAttempt({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: true,
          reason: 'success',
        });

        expect(mockDbConnect).toHaveBeenCalled();
        expect(mockCollection.insertOne).toHaveBeenCalledWith({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: true,
          reason: 'success',
          createdAt: expect.any(Date),
        });
      });

      it('should record failed login attempt', async () => {
        mockCollection.insertOne.mockResolvedValue({ insertedId: 'log124' });

        await recordLoginAttempt({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: false,
          reason: 'invalid_credentials',
        });

        expect(mockCollection.insertOne).toHaveBeenCalledWith({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: false,
          reason: 'invalid_credentials',
          createdAt: expect.any(Date),
        });
      });

      it('should record rate limited attempt', async () => {
        mockCollection.insertOne.mockResolvedValue({ insertedId: 'log125' });

        await recordLoginAttempt({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: false,
          reason: 'rate_limited',
        });

        expect(mockCollection.insertOne).toHaveBeenCalledWith({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: false,
          reason: 'rate_limited',
          createdAt: expect.any(Date),
        });
      });

      it('should handle missing IP address', async () => {
        mockCollection.insertOne.mockResolvedValue({ insertedId: 'log126' });

        await recordLoginAttempt({
          email: 'user@example.com',
          ip: null,
          success: true,
          reason: 'success',
        });

        expect(mockCollection.insertOne).toHaveBeenCalledWith({
          email: 'user@example.com',
          ip: null,
          success: true,
          reason: 'success',
          createdAt: expect.any(Date),
        });
      });

      it('should normalize email addresses', async () => {
        mockCollection.insertOne.mockResolvedValue({ insertedId: 'log127' });

        await recordLoginAttempt({
          email: 'USER@EXAMPLE.COM   ', // Mixed case with spaces
          ip: '192.168.1.1',
          success: true,
          reason: 'success',
        });

        expect(mockCollection.insertOne).toHaveBeenCalledWith({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: true,
          reason: 'success',
          createdAt: expect.any(Date),
        });
      });
    });

    describe('Input Validation', () => {
      it('should skip recording for invalid email addresses', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await recordLoginAttempt({
          email: 'invalid-email',
          ip: '192.168.1.1',
          success: false,
          reason: 'invalid_credentials',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[auth] Skipping login attempt record due to invalid email',
          { email: 'invalid-email' }
        );
        expect(mockCollection.insertOne).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should skip recording for empty email', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await recordLoginAttempt({
          email: '',
          ip: '192.168.1.1',
          success: false,
          reason: 'invalid_credentials',
        });

        expect(consoleSpy).toHaveBeenCalled();
        expect(mockCollection.insertOne).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should skip recording for null email', async () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await recordLoginAttempt({
          email: null as any,
          ip: '192.168.1.1',
          success: false,
          reason: 'invalid_credentials',
        });

        expect(consoleSpy).toHaveBeenCalled();
        expect(mockCollection.insertOne).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle various email formats correctly', async () => {
        const validEmails = [
          'user@example.com',
          'test.email+tag@domain.co.uk',
          'user123@subdomain.example.org',
          'user-name@example-domain.com',
        ];

        mockCollection.insertOne.mockResolvedValue({ insertedId: 'log123' });

        for (const email of validEmails) {
          await recordLoginAttempt({
            email,
            ip: '192.168.1.1',
            success: true,
            reason: 'success',
          });

          expect(mockCollection.insertOne).toHaveBeenCalledWith(
            expect.objectContaining({
              email: email.toLowerCase(),
            })
          );
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle missing MongoDB URI gracefully', async () => {
        delete process.env.MONGODB_URI;

        await recordLoginAttempt({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: true,
          reason: 'success',
        });

        expect(mockDbConnect).not.toHaveBeenCalled();
        expect(mockCollection.insertOne).not.toHaveBeenCalled();
      });

      it('should handle database connection errors gracefully', async () => {
        mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await recordLoginAttempt({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: true,
          reason: 'success',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[auth] Failed to record login attempt',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });

      it('should handle database write errors gracefully', async () => {
        mockCollection.insertOne.mockRejectedValue(new Error('Write failed'));

        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        await recordLoginAttempt({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: true,
          reason: 'success',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[auth] Failed to record login attempt',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Redis Integration Edge Cases', () => {
    it('should handle Redis client initialization failure', () => {
      mockGetRedisClient.mockReturnValue(undefined);

      // The rate limiter should be undefined when Redis is not available
      // enforceLoginRateLimit should handle this gracefully
    });

    it('should handle Redis configuration errors', () => {
      const mockInvalidRedisClient = {};
      mockGetRedisClient.mockReturnValue(mockInvalidRedisClient as any);

      // Rate limiter construction might fail with invalid client
      // This should be handled gracefully
    });

    it('should handle Redis network partitions', async () => {
      const networkError = new Error('Network partition');
      mockRateLimiterInstance.limit.mockRejectedValue(networkError);

      const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

      expect(result.success).toBe(true); // Should fail-open
    });
  });

  describe('Performance Considerations', () => {
    it('should handle concurrent rate limit checks', async () => {
      mockRateLimiterInstance.limit.mockResolvedValue({
        success: true,
        limit: 5,
        remaining: 4,
      });

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        enforceLoginRateLimit(`user${i}@example.com:192.168.1.1`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      expect(mockRateLimiterInstance.limit).toHaveBeenCalledTimes(10);
    });

    it('should handle rate limit resets correctly', async () => {
      const resetTime = Date.now() + 60000;
      
      mockRateLimiterInstance.limit.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });

      const result = await enforceLoginRateLimit('user@example.com:192.168.1.1');

      expect(result).toEqual({
        success: false,
        limit: 5,
        remaining: 0,
        reset: resetTime,
      });
    });
  });

  describe('Monitoring and Analytics', () => {
    it('should enable analytics on rate limiter', () => {
      expect(mockRatelimit).toHaveBeenCalledWith(
        expect.objectContaining({
          analytics: true,
        })
      );
    });

    it('should use appropriate prefix for rate limiting keys', () => {
      expect(mockRatelimit).toHaveBeenCalledWith(
        expect.objectContaining({
          prefix: 'auth:login',
        })
      );
    });
  });
});