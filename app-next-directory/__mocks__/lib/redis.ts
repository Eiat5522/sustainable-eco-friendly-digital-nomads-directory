import { jest } from '@jest/globals';

// Mock Redis client with common methods used in rate limiting
const mockRedisClient = {
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  evalSha: jest.fn().mockResolvedValue(['1', '1']),
  script: jest.fn().mockReturnValue({
    load: jest.fn().mockResolvedValue('script-hash'),
  }),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  ttl: jest.fn().mockResolvedValue(-1),
  ping: jest.fn().mockResolvedValue('PONG'),
};

export const getRedisClient = jest.fn(() => mockRedisClient);