// Proper mock setup to prevent worker crashes
const mockConnect = jest.fn();
const mockMongoClient = jest.fn(() => ({ connect: mockConnect }));

jest.mock('mongodb', () => ({
  __esModule: true,
  MongoClient: mockMongoClient,
}));

// Mock logger to prevent side effects
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@/lib/logger', () => ({
  structuredLogger: mockLogger,
}));

describe('mongodb client module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete (global as any)._mongoClientPromise;
    mockConnect.mockReset();
    mockMongoClient.mockClear();
    mockMongoClient.mockImplementation(() => ({ connect: mockConnect }));
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    delete (global as any)._mongoClientPromise;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('returns a mocked client when running in test environment', async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../mongodb');
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
    const mod = await import('../mongodb');
    const client = await mod.default;
    await expect(client.db().collection().findOne?.({})).resolves.toBeNull();
  });

  it('throws a helpful error when MONGODB_URI is missing outside test environments', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;
    delete process.env.E2E;

    const importPromise = import('../mongodb');
    const mod = await importPromise;
    await expect(mod.default).rejects.toThrow('Please add your MongoDB URI to .env.local');
  });

  it('points to the development env file when URI is missing locally', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    delete process.env.MONGODB_URI;
    delete process.env.E2E;

    const importPromise = import('../mongodb');
    const mod = await importPromise;
    await expect(mod.default).rejects.toThrow('Please add your MongoDB URI to .env.development');
  });

  it('reuses a single connection promise in development mode', async () => {
    jest.resetModules();
    mockConnect.mockResolvedValue({ connected: true });
    mockMongoClient.mockImplementation(() => ({ connect: mockConnect }));

    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.E2E;

    const first = await import('../mongodb');
    const second = await import('../mongodb');

    await first.default;
    await second.default;

    expect(mockMongoClient).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect((global as any)._mongoClientPromise).toBeDefined();
  });
  it('logs and rethrows connection errors outside of development caching', async () => {
    jest.resetModules();
    const error = new Error('boom');
    mockConnect.mockRejectedValue(error);
    mockMongoClient.mockImplementation(() => ({ connect: mockConnect }));

    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.E2E;

    const mod = await import('../mongodb');
    await expect(mod.default).rejects.toThrow('boom');
    expect(mockLogger.error).toHaveBeenCalledWith('MongoDB connection failed', error, {
      component: 'mongodb',
      message: 'boom',
    });
  });

  it('resets cached promise when development connection fails', async () => {
    jest.resetModules();
    const error = new Error('dev-fail');
    mockConnect.mockRejectedValue(error);
    mockMongoClient.mockImplementation(() => ({ connect: mockConnect }));

    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.E2E;

    const mod = await import('../mongodb');
    await expect(mod.default).rejects.toThrow('dev-fail');
    expect(mockLogger.error).toHaveBeenCalledWith('MongoDB connection failed', error, {
      component: 'mongodb',
      message: 'dev-fail',
    });
    expect((global as any)._mongoClientPromise).toBeUndefined();
  });

  it('returns a connected client in production when credentials are valid', async () => {
    jest.resetModules();
    const clientInstance = { ready: true };
    mockConnect.mockResolvedValue(clientInstance);
    mockMongoClient.mockImplementation(() => ({ connect: mockConnect }));

    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.E2E;

    const mod = await import('../mongodb');
    await expect(mod.default).resolves.toBe(clientInstance);
    expect(mockMongoClient).toHaveBeenCalledWith(
      'mongodb://localhost:27017/test',
      expect.objectContaining({ maxPoolSize: 10 })
    );
  });

  it('reuses an existing cached promise in development without reconnecting', async () => {
    jest.resetModules();
    const cached = Promise.resolve({ cached: true });
    (global as any)._mongoClientPromise = cached;

    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    delete process.env.E2E;

    const mod = await import('../mongodb');
    expect(mockMongoClient).not.toHaveBeenCalled();

    const result = await mod.default;
    expect(result).toEqual({ cached: true });
  });
});
