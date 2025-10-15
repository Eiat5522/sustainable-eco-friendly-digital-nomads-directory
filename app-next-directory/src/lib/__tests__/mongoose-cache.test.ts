import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('../redis', () => ({
  redis: redisMock,
}));

describe('withMongooseCache', () => {
  beforeEach(() => {
    jest.resetModules();
    redisMock.get.mockReset();
    redisMock.set.mockReset();
    redisMock.get.mockResolvedValue(null);
    redisMock.set.mockResolvedValue(undefined);
  });

  it('returns cached data when available', async () => {
    redisMock.get.mockResolvedValue(JSON.stringify({ id: 123 }));

    const { withMongooseCache } = await import('../mongoose-cache');

    const result = await withMongooseCache({ modelName: 'Listing' }, 'find', jest.fn(), 3600, {
      city: 'Lisbon',
    });

    expect(result).toEqual({ id: 123 });
    expect(redisMock.get).toHaveBeenCalledTimes(1);
  });

  it('executes the query and caches the result on miss', async () => {
    const queryResult = [{ id: 'abc' }];

    const { withMongooseCache } = await import('../mongoose-cache');
    const queryFn = jest.fn().mockResolvedValue(queryResult);

    const result = await withMongooseCache({ modelName: 'Listing' }, 'findByCity', queryFn, 180, {
      country: 'PT',
    });

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(result).toBe(queryResult);
    expect(redisMock.set).toHaveBeenCalledWith(
      'mongoose:Listing:findByCity:{"country":"PT"}',
      JSON.stringify(queryResult),
      { ex: 180 },
    );
  });
});
