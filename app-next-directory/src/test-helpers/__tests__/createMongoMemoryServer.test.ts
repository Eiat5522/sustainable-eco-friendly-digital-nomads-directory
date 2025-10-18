import { jest } from '@jest/globals';

jest.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: {
    create: jest.fn(),
  },
}));

const { MongoMemoryServer } = jest.requireMock('mongodb-memory-server') as {
  MongoMemoryServer: { create: jest.Mock };
};

describe('createMongoMemoryServer', () => {
  beforeEach(() => {
    jest.useRealTimers();
    MongoMemoryServer.create.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the MongoMemoryServer instance on first attempt', async () => {
    const mockServer = { stop: jest.fn() } as unknown as import('mongodb-memory-server').MongoMemoryServer;
    MongoMemoryServer.create.mockResolvedValueOnce(mockServer);

    const { createMongoMemoryServer } = await import('../createMongoMemoryServer');
    const server = await createMongoMemoryServer();

    expect(server).toBe(mockServer);
    expect(MongoMemoryServer.create).toHaveBeenCalledTimes(1);
  });

  it('retries creation when ETXTBSY occurs and eventually succeeds', async () => {
    jest.useFakeTimers();
    const mockServer = { stop: jest.fn() } as unknown as import('mongodb-memory-server').MongoMemoryServer;
    const busyError = Object.assign(new Error('text file busy'), { code: 'ETXTBSY' });
    MongoMemoryServer.create
      .mockRejectedValueOnce(busyError)
      .mockResolvedValueOnce(mockServer);

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const { createMongoMemoryServer } = await import('../createMongoMemoryServer');

    const serverPromise = createMongoMemoryServer({ retries: 3, retryDelayMs: 20 });

    await jest.advanceTimersByTimeAsync(20);
    const server = await serverPromise;

    expect(server).toBe(mockServer);
    expect(MongoMemoryServer.create).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 20);

    setTimeoutSpy.mockRestore();
  });

  it('throws immediately for non ETXTBSY errors', async () => {
    const failure = new Error('unexpected failure');
    MongoMemoryServer.create.mockRejectedValueOnce(failure);

    const { createMongoMemoryServer } = await import('../createMongoMemoryServer');

    await expect(createMongoMemoryServer()).rejects.toBe(failure);
    expect(MongoMemoryServer.create).toHaveBeenCalledTimes(1);
  });

  it('throws a descriptive error when retries are set to zero', async () => {
    const { createMongoMemoryServer } = await import('../createMongoMemoryServer');

    await expect(createMongoMemoryServer({ retries: 0 })).rejects.toThrow(
      'Failed to create MongoMemoryServer instance',
    );
    expect(MongoMemoryServer.create).not.toHaveBeenCalled();
  });
});
