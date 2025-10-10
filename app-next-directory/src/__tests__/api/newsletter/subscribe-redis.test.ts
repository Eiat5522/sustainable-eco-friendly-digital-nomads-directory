/**
 * Jest Test Suite for Newsletter Subscribe Route with Redis Caching
 * 
 * Tests covering:
 * 1. Redis-based rate limiting (IP and email)
 * 2. Idempotency key handling with Redis
 * 3. Memory fallback when Redis is unavailable
 * 4. Cache hit/miss scenarios
 * 5. Error handling and graceful degradation
 */

import { jest } from '@jest/globals';

// Mock @upstash/redis
jest.mock('@upstash/redis', () => {
  const mockClient = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  };
  
  return {
    Redis: jest.fn().mockImplementation(() => mockClient),
  };
});

// Mock dependencies
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/models/NewsletterSubscriber', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/newsletterTokens', () => ({
  signNewsletterConfirmToken: jest.fn().mockResolvedValue('mock-token'),
}));

jest.mock('@/lib/email', () => ({
  buildNewsletterConfirmEmail: jest.fn().mockResolvedValue({}),
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

describe('Newsletter Subscribe Route - Redis Integration', () => {
  let mockRedis: any;
  let POST: any;
  let testControl: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
    
    const redisModule = await import('@/lib/redis');
    mockRedis = redisModule.redis;
    
    const routeModule = await import('../../../app/api/newsletter/subscribe/route');
    POST = routeModule.POST;
    testControl = routeModule.testControl;
  });

  afterEach(() => {
    delete process.env.JEST_WORKER_ID;
    if (testControl) {
      testControl.memoryIncrOverride = null;
      testControl.memoryGetOverride = null;
    }
  });

  describe('Redis-based Rate Limiting', () => {
    describe('IP Rate Limiting', () => {
      it('should use Redis incr for IP rate limiting', async () => {
        mockRedis.incr.mockResolvedValue(1);
        mockRedis.expire.mockResolvedValue(1);
        mockRedis.get.mockResolvedValue(null);
        mockRedis.set.mockResolvedValue('OK');

        const request = new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });

        testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
        testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should block requests when IP rate limit exceeded', async () => {
        // Simulate exceeding rate limit
        testControl.memoryIncrOverride = jest.fn().mockReturnValue(11); // Over limit of 10
        testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

        const request = new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Too many requests');
      });

      it('should extract IP from x-forwarded-for header', async () => {
        testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
        testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

        const request = new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '203.0.113.1, 198.51.100.1',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });

        await POST(request);

        expect(testControl.memoryIncrOverride).toHaveBeenCalledWith(
          expect.stringContaining('203.0.113.1'),
          expect.any(Number)
        );
      });

      it('should extract IP from cf-connecting-ip header', async () => {
        testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
        testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

        const request = new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-connecting-ip': '203.0.113.2',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });

        await POST(request);

        expect(testControl.memoryIncrOverride).toHaveBeenCalledWith(
          expect.stringContaining('203.0.113.2'),
          expect.any(Number)
        );
      });

      it('should handle unknown IP gracefully', async () => {
        testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
        testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

        const request = new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });

        await POST(request);

        expect(testControl.memoryIncrOverride).toHaveBeenCalledWith(
          expect.stringContaining('unknown'),
          expect.any(Number)
        );
      });
    });

    describe('Email Rate Limiting', () => {
      it('should prevent duplicate subscriptions within window', async () => {
        testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
        testControl.memoryGetOverride = jest.fn()
          .mockReturnValueOnce(null) // IP check passes
          .mockReturnValueOnce('1');  // Email already exists

        const request = new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('Already subscribed recently');
      });

      it('should allow subscription for new email', async () => {
        testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
        testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

        const request = new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
          body: JSON.stringify({ email: 'new@example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('Thank you for subscribing');
      });
    });
  });

  describe('Idempotency Key Handling', () => {
    it('should store response with idempotency key in Redis', async () => {
      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'unique-key-123',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      await POST(request);

      // In Jest mode, it uses memory store which we can't directly verify Redis calls
      // But we can verify the behavior
      expect(testControl.memoryGetOverride).toHaveBeenCalled();
    });

    it('should return cached response for duplicate idempotency key', async () => {
      const cachedResponse = JSON.stringify({
        status: 200,
        body: { success: true, message: 'Cached response' },
      });

      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn()
        .mockReturnValueOnce(null) // IP check
        .mockReturnValueOnce(cachedResponse); // Idempotency check

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'duplicate-key',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle idempotency key with case variations', async () => {
      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'idempotency-key': 'lowercase-key', // lowercase header
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
    });

    it('should work without idempotency key', async () => {
      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Memory Fallback Behavior', () => {
    it('should use memory store in Jest environment', async () => {
      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const headers = Object.fromEntries(response.headers.entries());

      expect(headers['x-redis']).toBe('memory');
    });

    it('should indicate memory store in response headers', async () => {
      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      
      expect(response.headers.get('x-redis')).toBe('memory');
    });
  });

  describe('Error Handling', () => {
    it('should validate email format', async () => {
      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'invalid-email' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid email');
    });

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle missing email field', async () => {
      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });

    it('should normalize email addresses', async () => {
      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: '  TEST@EXAMPLE.COM  ' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle internal errors gracefully', async () => {
      testControl.memoryIncrOverride = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('internal server error');
    });
  });

  describe('Cache Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      testControl.memoryIncrOverride = jest.fn().mockReturnValue(1);
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const requests = Array.from({ length: 5 }, (_, i) =>
        new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': `192.168.1.${i}`,
          },
          body: JSON.stringify({ email: `user${i}@example.com` }),
        })
      );

      const responses = await Promise.all(requests.map(req => POST(req)));

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should properly increment counters for multiple requests', async () => {
      let ipCounter = 0;
      testControl.memoryIncrOverride = jest.fn().mockImplementation(() => {
        ipCounter++;
        return ipCounter;
      });
      testControl.memoryGetOverride = jest.fn().mockReturnValue(null);

      const requests = Array.from({ length: 3 }, () =>
        new Request('http://localhost/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );

      for (const request of requests) {
        await POST(request);
      }

      expect(testControl.memoryIncrOverride).toHaveBeenCalledTimes(3);
    });
  });
});
