import { structuredLogger } from '@/lib/logger';
import { withMongooseCache } from '../mongoose-cache';

const getRedisClientMock = jest.fn();

jest.mock('../redis', () => ({
  getRedisClient: jest.fn(() => getRedisClientMock()),
}));

describe('withMongooseCache', () => {
  const model = { modelName: 'TestModel' };

  beforeEach(() => {
    jest.clearAllMocks();
    getRedisClientMock.mockReset();
  });

  it('executes query function directly when redis client is unavailable', async () => {
    const queryFn = jest.fn(async () => ({ result: 'fresh' }));
    getRedisClientMock.mockReturnValue(undefined);

    const result = await withMongooseCache(model, 'findActive', queryFn);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ result: 'fresh' });
  });

  it('returns cached data without invoking the query function', async () => {
    const cachedValue = { id: 'cached' };
    const queryFn = jest.fn();
    getRedisClientMock.mockReturnValue({
      get: jest.fn().mockResolvedValue(JSON.stringify(cachedValue)),
      set: jest.fn(),
    });

    const result = await withMongooseCache(model, 'findActive', queryFn, 3600, { active: true });

    expect(queryFn).not.toHaveBeenCalled();
    expect(result).toEqual(cachedValue);
  });

  it('returns cached object when redis client already deserializes the value', async () => {
    const cachedValue = { id: 'cached-object' };
    const queryFn = jest.fn();
    getRedisClientMock.mockReturnValue({
      get: jest.fn().mockResolvedValue(cachedValue),
      set: jest.fn(),
    });

    const result = await withMongooseCache(model, 'findActive', queryFn);

    expect(queryFn).not.toHaveBeenCalled();
    expect(result).toEqual(cachedValue);
  });

  it('logs a warning and falls back to executing the query when cache read fails', async () => {
    const queryResult = { id: 'fresh' };
    const queryFn = jest.fn().mockResolvedValue(queryResult);
    const warnSpy = jest.spyOn(structuredLogger, 'warn').mockImplementation(() => {});
    const clientGet = jest.fn().mockRejectedValue(new Error('read error'));
    const clientSet = jest.fn();
    getRedisClientMock.mockReturnValue({ get: clientGet, set: clientSet });

    const result = await withMongooseCache(model, 'findActive', queryFn);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(clientSet).toHaveBeenCalledWith(
      expect.stringContaining('mongoose:TestModel:findActive'),
      JSON.stringify(queryResult),
      { ex: 3600 }
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[mongoose-cache] Failed to read from Redis cache',
      expect.any(Error)
    );
    expect(result).toEqual(queryResult);
    warnSpy.mockRestore();
  });

  it('logs a warning when cache write fails but still returns the query result', async () => {
    const queryResult = { id: 'fresh' };
    const queryFn = jest.fn().mockResolvedValue(queryResult);
    const warnSpy = jest.spyOn(structuredLogger, 'warn').mockImplementation(() => {});
    const client = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockRejectedValue(new Error('write error')),
    };
    getRedisClientMock.mockReturnValue(client);

    const result = await withMongooseCache(model, 'findActive', queryFn, 1800, { active: true });

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(client.set).toHaveBeenCalledWith(
      expect.stringContaining('mongoose:TestModel:findActive'),
      JSON.stringify(queryResult),
      { ex: 1800 }
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[mongoose-cache] Failed to write to Redis cache',
      expect.any(Error)
    );
    expect(result).toEqual(queryResult);
    warnSpy.mockRestore();
  });
});
