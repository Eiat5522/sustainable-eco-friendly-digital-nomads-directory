import { jest } from '@jest/globals';

jest.mock('@auth/mongodb-adapter', () => ({
  MongoDBAdapter: jest.fn(),
}));

const mockClient = { mocked: true };
const mockClientPromise = Promise.resolve(mockClient);

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: mockClientPromise,
}));

import { MongoDBAdapter } from '@auth/mongodb-adapter';

const mockMongoDBAdapter = MongoDBAdapter as jest.MockedFunction<typeof MongoDBAdapter>;

describe('createAuthAdapter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns undefined when MongoDB URI is missing', () => {
    delete process.env.MONGODB_URI;

    const { createAuthAdapter } = require('./adapter');
    expect(createAuthAdapter()).toBeUndefined();
    expect(mockMongoDBAdapter).not.toHaveBeenCalled();
  });

  it('returns undefined when running in Jest environment (default behavior)', () => {
    process.env.MONGODB_URI = 'mongodb://example.com';
    // JEST_WORKER_ID is automatically set by Jest, so adapter returns undefined

    const { createAuthAdapter } = require('./adapter');
    const adapter = createAuthAdapter();
    expect(adapter).toBeUndefined();
    expect(mockMongoDBAdapter).not.toHaveBeenCalled();
  });

  it('returns MongoDB adapter when USE_REAL_MONGODB_FOR_TESTS is set', async () => {
    process.env.MONGODB_URI = 'mongodb://example.com';
    process.env.USE_REAL_MONGODB_FOR_TESTS = '1';
    const adapterInstance = { connected: true };
    mockMongoDBAdapter.mockReturnValue(adapterInstance as any);

    const { createAuthAdapter } = require('./adapter');
    const adapter = createAuthAdapter();
    expect(mockMongoDBAdapter).toHaveBeenCalledTimes(1);
    const [clientArg] = mockMongoDBAdapter.mock.calls[0] ?? [];
    await expect(clientArg).resolves.toEqual(mockClient);
    expect(adapter).toBe(adapterInstance);
  });
});
