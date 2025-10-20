import { MongoMemoryServer } from 'mongodb-memory-server';
import { createMongoMemoryServer } from '../createMongoMemoryServer';

jest.mock('mongodb-memory-server', () => ({
  MongoMemoryServer: {
    create: jest.fn(),
  },
}));

const createMock = MongoMemoryServer.create as jest.MockedFunction<typeof MongoMemoryServer.create>;

describe('createMongoMemoryServer', () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it('returns the server instance on the first attempt', async () => {
    const server = { stop: jest.fn() } as unknown as MongoMemoryServer;
    createMock.mockResolvedValueOnce(server);

    await expect(createMongoMemoryServer()).resolves.toBe(server);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('retries when the underlying binary is busy and eventually succeeds', async () => {
    const busyError = Object.assign(new Error('text file busy'), { code: 'ETXTBSY' });
    const server = { stop: jest.fn() } as unknown as MongoMemoryServer;

    createMock
      .mockRejectedValueOnce(busyError)
      .mockResolvedValueOnce(server);

    await expect(
      createMongoMemoryServer({ retries: 2, retryDelayMs: 0 }),
    ).resolves.toBe(server);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it('propagates the last error when retries are exhausted', async () => {
    const busyError = Object.assign(new Error('still busy'), { code: 'ETXTBSY' });
    createMock.mockRejectedValue(busyError);

    await expect(
      createMongoMemoryServer({ retries: 2, retryDelayMs: 0 }),
    ).rejects.toBe(busyError);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it('fails immediately for non-ETXTBSY errors', async () => {
    const fatalError = new Error('unexpected failure');
    createMock.mockRejectedValueOnce(fatalError);

    await expect(createMongoMemoryServer()).rejects.toBe(fatalError);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});
