import { jest } from '@jest/globals';

jest.mock('@auth/mongodb-adapter', () => ({
  MongoDBAdapter: jest.fn(() => ({ adapter: true })),
}));

import clientPromise from '@/lib/mongodb';

const { MongoDBAdapter } = jest.requireMock('@auth/mongodb-adapter');
const mockedMongoAdapter = MongoDBAdapter as jest.Mock;
const expectedClientPromise = clientPromise;

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
    expect(MongoDBAdapter).not.toHaveBeenCalled();
  });

  it('returns MongoDB adapter when MongoDB URI is set', () => {
    process.env.MONGODB_URI = 'mongodb://example.com';
    const adapterInstance = { connected: true };
    mockedMongoAdapter.mockReturnValue(adapterInstance);

    const { createAuthAdapter } = require('./adapter');
    const adapter = createAuthAdapter();
    expect(MongoDBAdapter).toHaveBeenCalledWith(expectedClientPromise);
    expect(adapter).toBe(adapterInstance);
  });
});
