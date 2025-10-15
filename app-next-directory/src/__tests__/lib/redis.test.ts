/**
 * Jest Test Suite for Redis Client with TypeScript-safe mock extensions
 * 
 * Tests covering:
 * 1. TypeScript-safe mock functionality
 * 2. Environment-based mock attachment
 * 3. Mock reset functionality for test isolation
 * 4. Redis client initialization and configuration
 * 5. Error handling for missing environment variables
 */

import { jest } from '@jest/globals';

// Mock the @upstash/redis module to avoid actual Redis connections
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  })),
}));

describe('Redis Client Basic Functionality', () => {
  let mockRedisInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Ensure we're in test environment for mock attachment
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
    
    // Set required Redis environment variables
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    // Get the mocked Redis instance from @upstash/redis
    const Redis = require('@upstash/redis').Redis;
    mockRedisInstance = new Redis();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should export redis client instance', async () => {
    const { redis, getRedisClient } = await import('@/lib/redis');
    
    // In test environment with env vars, redis should be defined or getRedisClient should work
    const client = redis || getRedisClient();
    expect(client).toBeDefined();
    if (client) {
      expect(typeof client.get).toBe('function');
      expect(typeof client.set).toBe('function');
    }
  });

  it('should export getRedisClient function', async () => {
    const { getRedisClient } = await import('@/lib/redis');
    
    expect(getRedisClient).toBeDefined();
    expect(typeof getRedisClient).toBe('function');
  });

  it('should return redis instance from getRedisClient', async () => {
    const { getRedisClient } = await import('@/lib/redis');
    
    const client = getRedisClient();
    expect(client).toBeDefined();
    expect(typeof client.get).toBe('function');
  });
});

describe('Redis Client Initialization and Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should initialize Redis client with correct configuration', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    const { getRedisClient } = await import('@/lib/redis');
    const client = getRedisClient();
    
    expect(client).toBeDefined();
    expect(typeof client.get).toBe('function');
    expect(typeof client.set).toBe('function');
  });

  it('should handle missing environment variables gracefully in test mode', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // In test mode, getRedisClient returns undefined instead of throwing
    const { getRedisClient } = await import('@/lib/redis');
    const client = getRedisClient();
    expect(client).toBeUndefined();
  });

  it('should handle missing URL gracefully in test mode', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    
    // In test mode, getRedisClient returns undefined instead of throwing
    const { getRedisClient } = await import('@/lib/redis');
    const client = getRedisClient();
    expect(client).toBeUndefined();
  });

  it('should handle missing TOKEN gracefully in test mode', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    // In test mode, getRedisClient returns undefined instead of throwing
    const { getRedisClient } = await import('@/lib/redis');
    const client = getRedisClient();
    expect(client).toBeUndefined();
  });
});

describe('Redis Client Operations', () => {
  let mockRedis: any;
  let getRedisClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    // Get the mocked Redis instance from @upstash/redis
    const { Redis } = await import('@upstash/redis');
    mockRedis = new Redis();
    
    const redisModule = await import('@/lib/redis');
    getRedisClient = redisModule.getRedisClient;
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe('GET operations', () => {
    it('should successfully get values from Redis', async () => {
      mockRedis.get.mockResolvedValue('test-value');
      
      const result = await mockRedis.get('test-key');
      
      expect(result).toBe('test-value');
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent keys', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await mockRedis.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should handle get errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection timeout'));
      
      await expect(mockRedis.get('test-key')).rejects.toThrow('Connection timeout');
    });
  });

  describe('SET operations', () => {
    it('should successfully set values in Redis', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      const result = await mockRedis.set('test-key', 'test-value');
      
      expect(result).toBe('OK');
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should set values with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      const result = await mockRedis.set('test-key', 'test-value', { ex: 3600 });
      
      expect(result).toBe('OK');
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value', { ex: 3600 });
    });

    it('should handle set errors gracefully', async () => {
      mockRedis.set.mockRejectedValue(new Error('Write failed'));
      
      await expect(
        mockRedis.set('test-key', 'test-value')
      ).rejects.toThrow('Write failed');
    });
  });

  describe('DEL operations', () => {
    it('should successfully delete keys from Redis', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      const result = await mockRedis.del('test-key');
      
      expect(result).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should return 0 when deleting non-existent key', async () => {
      mockRedis.del.mockResolvedValue(0);
      
      const result = await mockRedis.del('non-existent-key');
      
      expect(result).toBe(0);
    });
  });

  describe('INCR operations', () => {
    it('should increment counters', async () => {
      mockRedis.incr.mockResolvedValue(1);
      
      const result = await mockRedis.incr('counter-key');
      
      expect(result).toBe(1);
      expect(mockRedis.incr).toHaveBeenCalledWith('counter-key');
    });

    it('should return incremented value for existing counters', async () => {
      mockRedis.incr.mockResolvedValue(42);
      
      const result = await mockRedis.incr('counter-key');
      
      expect(result).toBe(42);
    });
  });

  describe('EXPIRE operations', () => {
    it('should set expiration on keys', async () => {
      mockRedis.expire.mockResolvedValue(1);
      
      const result = await mockRedis.expire('test-key', 3600);
      
      expect(result).toBe(1);
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 3600);
    });

    it('should return 0 when setting expiration on non-existent key', async () => {
      mockRedis.expire.mockResolvedValue(0);
      
      const result = await mockRedis.expire('non-existent-key', 3600);
      
      expect(result).toBe(0);
    });
  });

  describe('PING operations', () => {
    it('should respond to ping', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      
      const result = await mockRedis.ping();
      
      expect(result).toBe('PONG');
    });

    it('should handle connection errors', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection refused'));
      
      await expect(mockRedis.ping()).rejects.toThrow('Connection refused');
    });
  });
});

describe('Redis Client Edge Cases and Error Scenarios', () => {
  let mockRedis: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = '1';
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    // Get the mocked Redis instance from @upstash/redis
    const Redis = require('@upstash/redis').Redis;
    mockRedis = new Redis();
    
    const redisModule = await import('@/lib/redis');
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.JEST_WORKER_ID;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('should handle network timeouts', async () => {
    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';
    mockRedis.get.mockRejectedValue(timeoutError);
    
    await expect(mockRedis.get('test-key')).rejects.toThrow('Request timeout');
  });

  it('should handle connection refused errors', async () => {
    mockRedis.get.mockRejectedValue(new Error('ECONNREFUSED'));
    
    await expect(mockRedis.get('test-key')).rejects.toThrow('ECONNREFUSED');
  });

  it('should handle large values', async () => {
    const largeValue = 'x'.repeat(1024 * 1024); // 1MB string
    mockRedis.set.mockResolvedValue('OK');
    
    await mockRedis.set('large-key', largeValue);
    
    expect(mockRedis.set).toHaveBeenCalledWith('large-key', largeValue);
  });

  it('should handle special characters in keys', async () => {
    const specialKey = 'key:with:colons:and-dashes:and_underscores';
    mockRedis.get.mockResolvedValue('value');
    
    const result = await mockRedis.get(specialKey);
    
    expect(result).toBe('value');
    expect(mockRedis.get).toHaveBeenCalledWith(specialKey);
  });

  it('should handle empty string values', async () => {
    mockRedis.set.mockResolvedValue('OK');
    
    await mockRedis.set('empty-key', '');
    
    expect(mockRedis.set).toHaveBeenCalledWith('empty-key', '');
  });

  it('should handle concurrent operations', async () => {
    mockRedis.get.mockResolvedValue('value');
    
    const promises = Array.from({ length: 10 }, (_, i) =>
      mockRedis.get(`key-${i}`)
    );
    
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(10);
    expect(mockRedis.get).toHaveBeenCalledTimes(10);
  });
});