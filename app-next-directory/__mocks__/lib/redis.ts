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

// Listener registry for onRedisClientChange
const listeners: Set<(client: any) => void> = new Set();

export function onRedisClientChange(fn: (client: any) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function _notifyRedisClientChange(client: any) {
  for (const l of listeners) l(client);
}

export const getRedisClient = jest.fn(() => mockRedisClient);

// Provide test helper shims so tests can call mockGetRedisClient.mockClear()
// and friends on the exported function.
(getRedisClient as any).mockClear = () => {
  (getRedisClient as any).mock.calls = [];
};
(getRedisClient as any).mockReset = () => {
  (getRedisClient as any).mock.calls = [];
  jest.clearAllMocks();
};
(getRedisClient as any).mockReturnValue = (val: any) => {
  (getRedisClient as any).mockImplementation(() => val);
};

export default getRedisClient;