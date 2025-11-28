jest.mock('mongodb', () => {
  const connect = jest.fn();
  return {
    __esModule: true,
    MongoClient: jest.fn(() => ({ connect })),
    connectMock: connect,
  };
});

import { structuredLogger } from '@/lib/logger';

describe('mongodb client module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete (global as any)._mongoClientPromise;
    const { MongoClient, connectMock } = jest.requireMock('mongodb') as {
      MongoClient: jest.Mock;
      connectMock: jest.Mock;
    };
    connectMock.mockReset();
    MongoClient.mockImplementation(() => ({ connect: connectMock }));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns a mocked client when running in test environment', async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../mongodb.ts');
    const client = await mod.default;

    expect(typeof client.db).toBe('function');
    const db = client.db();
    expect(typeof db.collection).toBe('function');
    await expect(db.createCollection?.('demo')).resolves.toEqual({});
    const collection = db.collection('any');
    await expect(collection.insertOne?.({})).resolves.toEqual({ insertedId: 'mock' });
    await expect(collection.createIndexes?.()).resolves.toEqual({});
    await expect(collection.findOne?.({})).resolves.toBeNull();
    await expect(collection.updateOne?.({}, {})).resolves.toEqual({
      matchedCount: 0,
      modifiedCount: 0,
    });
    await expect(collection.deleteOne?.({})).resolves.toEqual({ deletedCount: 0 });
  });

  it('uses the mock client when E2E mode is enabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.E2E = '1';
    const mod = await import('../mongodb.ts');
    const client = await mod.default;
    await expect(client.db().collection().findOne?.({})).resolves.toBeNull();
    delete process.env.E2E;
  });

  it('throws a helpful error when MONGODB_URI is missing outside test environments', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;

    await expect(import('../mongodb.ts')).rejects.toThrow(
      'Please add your MongoDB URI to .env.local'
    );
  });

  it('points to the development env file when URI is missing locally', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.MONGODB_URI;

    await expect(import('../mongodb.ts')).rejects.toThrow(
      'Please add your MongoDB URI to .env.development'
    );
  });

  it('reuses a single connection promise in development mode', async () => {
    const { MongoClient } = jest.requireMock('mongodb') as { MongoClient: jest.Mock };
    const connectMock = jest.fn().mockResolvedValue({ connected: true });

    MongoClient.mockImplementation(() => ({ connect: connectMock }));

    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const first = await import('../mongodb.ts');
    const second = await import('../mongodb.ts');

    await first.default;
    await second.default;

    expect(MongoClient).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect((global as any)._mongoClientPromise).toBeDefined();
  });

  it('logs and rethrows connection errors outside of development caching', async () => {
    const { MongoClient } = jest.requireMock('mongodb') as { MongoClient: jest.Mock };
    const error = new Error('boom');
    MongoClient.mockImplementation(() => ({ connect: jest.fn().mockRejectedValue(error) }));

    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const mod = await import('../mongodb.ts');
    await expect(mod.default).rejects.toThrow('boom');
    expect(structuredLogger.error).toHaveBeenCalledWith('MongoDB connection failed:', error);
  });

  it('resets cached promise when development connection fails', async () => {
    const { MongoClient } = jest.requireMock('mongodb') as { MongoClient: jest.Mock };
    const error = new Error('dev-fail');
    MongoClient.mockImplementation(() => ({ connect: jest.fn().mockRejectedValue(error) }));

    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const mod = await import('../mongodb.ts');
    await expect(mod.default).rejects.toThrow('dev-fail');
    expect(structuredLogger.error).toHaveBeenCalledWith('MongoDB connection failed:', error);
    expect((global as any)._mongoClientPromise).toBeUndefined();
  });

  it('returns a connected client in production when credentials are valid', async () => {
    const { MongoClient } = jest.requireMock('mongodb') as { MongoClient: jest.Mock };
    const clientInstance = { ready: true };
    const connectMock = jest.fn().mockResolvedValue(clientInstance);
    MongoClient.mockImplementation(() => ({ connect: connectMock }));

    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const mod = await import('../mongodb.ts');
    await expect(mod.default).resolves.toBe(clientInstance);
    expect(MongoClient).toHaveBeenCalledWith(
      'mongodb://localhost:27017/test',
      expect.objectContaining({ maxPoolSize: 10 })
    );
  });

  it('reuses an existing cached promise in development without reconnecting', async () => {
    const { MongoClient } = jest.requireMock('mongodb') as { MongoClient: jest.Mock };
    const cached = Promise.resolve({ cached: true });
    (global as any)._mongoClientPromise = cached;

    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    const mod = await import('../mongodb.ts');
    expect(MongoClient).not.toHaveBeenCalled();
    expect(mod.default).toBe(cached);

    delete (global as any)._mongoClientPromise;
  });
});
