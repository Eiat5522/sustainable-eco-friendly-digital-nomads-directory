import { jest } from '@jest/globals';

// Mock Redis client with common methods used in rate limiting
const mockRedisClient = {
  incr: jest.fn<() => Promise<number>>().mockResolvedValue(1),
  expire: jest.fn<() => Promise<number>>().mockResolvedValue(1),
  evalSha: jest.fn<() => Promise<[string, string]>>().mockResolvedValue(['1', '1']),
  script: jest.fn<() => { load: ReturnType<typeof jest.fn> }>().mockReturnValue({
    load: jest.fn<() => Promise<string>>().mockResolvedValue('script-hash'),
  }),
  get: jest.fn<() => Promise<null>>().mockResolvedValue(null),
  set: jest.fn<() => Promise<string>>().mockResolvedValue('OK'),
  del: jest.fn<() => Promise<number>>().mockResolvedValue(1),
  exists: jest.fn<() => Promise<number>>().mockResolvedValue(0),
  ttl: jest.fn<() => Promise<number>>().mockResolvedValue(-1),
  ping: jest.fn<() => Promise<string>>().mockResolvedValue('PONG'),
};

// Track the current client so subscribers receive the current state
let currentClient: typeof mockRedisClient | undefined = mockRedisClient;

// Listener registry for onRedisClientChange
const listeners: Set<(client: typeof mockRedisClient | undefined) => void> = new Set();

export function onRedisClientChange(fn: (client: typeof mockRedisClient | undefined) => void) {
  listeners.add(fn);
  // Immediately notify subscriber of current client to match runtime behaviour
  try {
    fn(currentClient);
  } catch (_e) {
    // best-effort
  }

  return () => listeners.delete(fn);
}

export function _notifyRedisClientChange(client: typeof mockRedisClient | undefined) {
  currentClient = client;
  for (const l of Array.from(listeners)) {
    try {
      l(client);
    } catch (_e) {
      // Listener errors should not break the emitter
    }
  }
}

export const getRedisClient = jest.fn<() => typeof mockRedisClient>(() => mockRedisClient);

// Type-safe mock helpers
interface MockFunctionExtensions {
  mockClear: () => void;
  mockResetClient: () => void;
  mockClearAndReset: () => void;
}

// Extend the jest function type
type ExtendedMockFunction = typeof getRedisClient & MockFunctionExtensions;

// Provide test helper shims so tests can call mockGetRedisClient.mockClear()
// and friends on the exported function. These helpers also update the
// `currentClient` and notify listeners to mimic the real `src/lib/redis.ts`.
const mockClear = () => {
  // Only clear recorded calls to align with Jest's mockClear semantics in our shim
  // Do not alter implementation or notify listeners here.
  getRedisClient.mock.calls = [];
};

/**
 * Jest mock helpers:
 * - mockClear: only clears call history (matches Jest semantics)
 * - mockResetClient: resets implementation to undefined and notifies listeners (for full reset)
 *
 * Use mockClear for normal test isolation. Use mockResetClient if you need to simulate client disconnect/reset.
 */
const mockResetClient = () => {
  // Only clear recorded calls to align with Jest's mockClear semantics in our shim
  getRedisClient.mock.calls = [];
};

// Provide an explicit, lighter reset that only changes the return implementation
// and notifies listeners, without clearing other internal mocks or listeners.
// This allows tests to opt-in to resetting the client state without the side effects
// previously bundled into mockClear.
const mockResetClientLight = () => {
  (getRedisClient as any).mockImplementation(() => undefined);
  _notifyRedisClientChange(undefined);
};

// Back-compat alias with a descriptive name if tests expect a combined action
const mockClearAndReset = mockResetClientLight;

// Apply the extensions
const extendedGetRedisClient = getRedisClient as ExtendedMockFunction;
extendedGetRedisClient.mockClear = mockClear;
extendedGetRedisClient.mockResetClient = mockResetClientLight;
extendedGetRedisClient.mockClearAndReset = mockClearAndReset;

// Re-export with the extended interface
export { mockClear, mockResetClient, mockClearAndReset };

export default getRedisClient;