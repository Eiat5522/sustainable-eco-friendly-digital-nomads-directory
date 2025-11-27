import { cachedClient } from './cached-client';

jest.mock('../redis', () => ({
  getRedisClient: jest.fn(),
}));

jest.mock('./client', () => {
  const fetchMock = jest.fn();
  const mockClientInstance = {
    fetch: fetchMock,
  };
  return {
    __esModule: true,
    client: jest.fn(() => mockClientInstance), // Mock `client` as a function returning the mocked instance
    __mock: {
      fetchMock,
      mockClientInstance,
    },
  };
});

const getRedisClientMock = jest.requireMock('../redis').getRedisClient as jest.Mock;
const sanityClientMock = jest.requireMock('./client').client as jest.Mock<
  () => { fetch: jest.Mock }
>;

describe('cachedClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRedisClientMock.mockReturnValue(undefined);
  });

  it('returns cached data when available in redis', async () => {
    const cachedValue = { id: '123', title: 'Cached result' };
    const getMock = jest.fn().mockResolvedValue(JSON.stringify(cachedValue));
    getRedisClientMock.mockReturnValue({ get: getMock, set: jest.fn() });

    const result = await cachedClient.fetch('mock-query', { foo: 'bar' });

    expect(result).toEqual(cachedValue);
    expect(getMock).toHaveBeenCalledWith(expect.stringContaining('sanity:mock-query'));
    expect(sanityClientMock().fetch).not.toHaveBeenCalled();
  });

  it('fetches from Sanity and caches when redis has no data', async () => {
    const setMock = jest.fn().mockResolvedValue('OK');
    const redisClient = { get: jest.fn().mockResolvedValue(null), set: setMock };
    getRedisClientMock.mockReturnValue(redisClient);

    const freshData = { id: '456', title: 'Fresh result' };
    sanityClientMock().fetch.mockResolvedValueOnce(freshData);

    const result = await cachedClient.fetch('fresh-query', { alpha: 'beta' });

    expect(result).toEqual(freshData);
    expect(setMock).toHaveBeenCalledWith(
      expect.stringContaining('sanity:fresh-query'),
      JSON.stringify(freshData),
      { ex: 3600 }
    );
  });

  it('fetches directly when redis client is unavailable', async () => {
    getRedisClientMock.mockReturnValue(undefined);
    const payload = { id: 'no-redis' };
    sanityClientMock().fetch.mockResolvedValueOnce(payload);

    const result = await cachedClient.fetch('no-redis', { env: 'test' });

    expect(result).toEqual(payload);
    expect(sanityClientMock().fetch).toHaveBeenCalledWith('no-redis', { env: 'test' });
  });

  it('deduplicates concurrent fetches for the same query and params', async () => {
    const redisClient = { get: jest.fn().mockResolvedValue(null), set: jest.fn() };
    getRedisClientMock.mockReturnValue(redisClient);

    let resolveFetch: (value: unknown) => void = () => undefined;
    const fetchPromise = new Promise(resolve => {
      resolveFetch = resolve;
    });

    sanityClientMock().fetch.mockReturnValue(fetchPromise);

    const promise1 = cachedClient.fetch('coalesce-query', { page: 1 });
    const promise2 = cachedClient.fetch('coalesce-query', { page: 1 });

    resolveFetch({ docs: ['a', 'b'] });

    const [result1, result2] = await Promise.all([promise1, promise2]);
    expect(result1).toEqual({ docs: ['a', 'b'] });
    expect(result2).toEqual({ docs: ['a', 'b'] });
    expect(sanityClientMock().fetch).toHaveBeenCalledTimes(1);

    sanityClientMock().fetch.mockReset();
    sanityClientMock().fetch.mockResolvedValueOnce({ docs: ['c'] });
    const nextResult = await cachedClient.fetch('coalesce-query', { page: 1 });
    expect(nextResult).toEqual({ docs: ['c'] });
    expect(sanityClientMock().fetch).toHaveBeenCalledTimes(1);
  });

  it('logs and continues when redis read fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = new Error('redis down');
    const redisClient = { get: jest.fn().mockRejectedValue(error), set: jest.fn() };
    getRedisClientMock.mockReturnValue(redisClient);

    sanityClientMock().fetch.mockResolvedValueOnce({ value: 1 });

    const result = await cachedClient.fetch('unstable-query', {});

    expect(result).toEqual({ value: 1 });
    expect(warnSpy).toHaveBeenCalledWith('Cache read failed, falling through to fetch:', error);

    warnSpy.mockRestore();
  });

  it('ignores redis write errors after fetching fresh data', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const writeError = new Error('write failed');
    const redisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockRejectedValue(writeError),
    };
    getRedisClientMock.mockReturnValue(redisClient);

    sanityClientMock().fetch.mockResolvedValueOnce({ value: 2 });

    const result = await cachedClient.fetch('write-failure', {});

    expect(result).toEqual({ value: 2 });
    expect(warnSpy).toHaveBeenCalledWith(
      'Cache write failed, continuing without Redis:',
      writeError
    );

    warnSpy.mockRestore();
  });
});
