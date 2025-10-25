import { jest } from '@jest/globals';

const mockRedisClient: Record<string, jest.Mock> = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};

export type MockRedisClient = typeof mockRedisClient;

export const getRedisClient: jest.Mock<() => MockRedisClient> = jest.fn(() => mockRedisClient);