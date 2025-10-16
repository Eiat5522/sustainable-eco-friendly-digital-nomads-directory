/**
 * Unit tests for the dbConnect helper.
 * These tests rely on the project-level mongoose mock (moduleNameMapper) so we can
 * assert caching behaviour without a real database connection.
 */

import { jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const loadDbConnect = async () => {
  const module = await import('../dbConnect');
  return module.default;
};

const importMongooseMock = async () => {
  const mod = await import('mongoose');
  return (mod as unknown as { default: { connect: jest.Mock; connection: any } }).default;
};

describe('dbConnect (unit)', () => {
  let mongooseMock: Awaited<ReturnType<typeof importMongooseMock>>;
  let mockConnect: jest.Mock;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV, MONGODB_URI: 'mongodb://localhost:27017/testdb' };
    delete (global as typeof globalThis & { mongoose?: unknown }).mongoose;

    mongooseMock = await importMongooseMock();
    mockConnect = mongooseMock.connect;
    mockConnect.mockReset();
    mongooseMock.connection.readyState = 1;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete (global as typeof globalThis & { mongoose?: unknown }).mongoose;
  });

  it('connects once and caches the resolved mongoose instance', async () => {
  const mockConnection = { connection: { readyState: 1 } } as unknown;
    mockConnect.mockResolvedValue(mockConnection);

    const dbConnect = await loadDbConnect();
    const first = await dbConnect();
    const second = await dbConnect();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb', { bufferCommands: false });
    expect(first).toBe(mockConnection);
    expect(second).toBe(mockConnection);
  });

  it('resets the cached promise when mongoose.connect rejects', async () => {
  const dbConnect = await loadDbConnect();
    const failure = new Error('connect failed');
    mockConnect.mockRejectedValueOnce(failure);

    await expect(dbConnect()).rejects.toThrow('connect failed');

    const mockConnection = { connection: { readyState: 1 } } as unknown;
    mockConnect.mockResolvedValueOnce(mockConnection);

    const retry = await dbConnect();

    expect(mockConnect).toHaveBeenCalledTimes(2);
    expect(retry).toBe(mockConnection);
  });

  it('deduplicates concurrent connection attempts', async () => {
  const dbConnect = await loadDbConnect();
    const mockConnection = { connection: { readyState: 1 } } as unknown;

    let resolveConnect: (value: unknown) => void = () => {};
    const connectPromise = new Promise<unknown>((resolve) => {
      resolveConnect = resolve;
    });
    mockConnect.mockReturnValueOnce(connectPromise);

    const [a, b, c] = [dbConnect(), dbConnect(), dbConnect()];
    resolveConnect(mockConnection);

    const results = await Promise.all([a, b, c]);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(mockConnection);
  });

  it('throws during module evaluation when MONGODB_URI is missing', async () => {
    delete process.env.MONGODB_URI;
    jest.resetModules();

    await expect(import('../dbConnect')).rejects.toThrow('MONGODB_URI environment variable is required');
  });
});