import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const redisCtorMock = jest.fn();

const createRedisClientInstance = () => ({
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  ping: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
});

jest.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(config: unknown) {
      redisCtorMock(config);
      Object.assign(this, createRedisClientInstance());
    }
  },
}));

describe('redis helper module', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      UPSTASH_REDIS_REST_URL: 'https://redis.example.com',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
    };
    redisCtorMock.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('throws if credentials are missing when creating a client', async () => {
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';

    const mod = await import('../redis');

    expect(() => mod.createRedisClient()).toThrow('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set');
  });

  it('creates a Redis client with the provided credentials', async () => {
    const mod = await import('../redis');
    const client = mod.createRedisClient();

    expect(redisCtorMock).toHaveBeenCalledWith({
      url: 'https://redis.example.com',
      token: 'test-token',
    });
    expect(client).toHaveProperty('set');
  });

  it('provides test helpers for swapping the active redis client', async () => {
    const mod = await import('../redis');
    const listener = jest.fn();

    const unsubscribe = mod.onRedisClientChange(listener);
    expect(listener).toHaveBeenCalledWith(undefined);

    const mockClient = { get: jest.fn() } as unknown as ReturnType<typeof mod.createRedisClient>;
    mod.getRedisClient.mockReturnValue(mockClient);

    expect(mod.getRedisClient()).toBe(mockClient);
    expect(listener).toHaveBeenCalledWith(mockClient);

    mod.getRedisClient.mockReset();
    expect(mod.getRedisClient()).toBeUndefined();

    unsubscribe();
  });
});
