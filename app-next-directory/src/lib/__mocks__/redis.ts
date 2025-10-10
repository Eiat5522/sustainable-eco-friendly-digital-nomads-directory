import { jest } from '@jest/globals';

const mockRedisClient = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};

export const getRedisClient = jest.fn(() => mockRedisClient);