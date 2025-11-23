/**
 * @fileoverview Unit tests for the listing view metrics helpers.
 */

const getCollectionMock = jest.fn();

jest.mock('@/utils/db-helpers', () => ({
  getCollection: getCollectionMock,
}));

type TestCursor<T = any> = {
  toArray: jest.Mock<Promise<T[]>, []>;
};

type TestCollection = {
  createIndex: jest.Mock<
    Promise<string | undefined>,
    [Record<string, unknown>, Record<string, unknown>]
  >;
  updateOne: jest.Mock<
    Promise<any>,
    [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]
  >;
  find: jest.Mock<TestCursor, [Record<string, unknown>]>;
  aggregate: jest.Mock<TestCursor, [Array<Record<string, unknown>>]>;
};

function createMockCollection() {
  const findCursor: TestCursor = {
    toArray: jest.fn().mockResolvedValue([]),
  };
  const aggregateCursor: TestCursor = {
    toArray: jest.fn().mockResolvedValue([]),
  };
  const collection: TestCollection = {
    createIndex: jest.fn().mockResolvedValue('listingId_1_month_1'),
    updateOne: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockReturnValue(findCursor),
    aggregate: jest.fn().mockReturnValue(aggregateCursor),
  };
  return { collection, findCursor, aggregateCursor };
}

function interceptIndexCatch(collection: TestCollection) {
  let handler: ((error: unknown) => unknown) | undefined;

  collection.createIndex.mockImplementationOnce(() => {
    const thenable = {
      catch(nextHandler: (error: unknown) => unknown) {
        handler = nextHandler;
        return Promise.resolve();
      },
    };
    return thenable as unknown as Promise<string | undefined>;
  });

  return {
    trigger(error: unknown) {
      if (typeof handler !== 'function') {
        throw new Error('Index catch handler was not registered');
      }
      return handler(error);
    },
    handlerRegistered() {
      return typeof handler === 'function';
    },
  };
}

let mockCollection: TestCollection;
let findCursor: TestCursor;
let aggregateCursor: TestCursor;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  const setup = createMockCollection();
  mockCollection = setup.collection;
  findCursor = setup.findCursor;
  aggregateCursor = setup.aggregateCursor;

  getCollectionMock.mockResolvedValue(mockCollection);
});

describe('recordListingView', () => {
  it('throws when listingId is missing', async () => {
    const { recordListingView } = await import('../metrics/listing-views');
    await expect(recordListingView('', new Date('2024-01-01T00:00:00.000Z'))).rejects.toThrow(
      'listingId is required to record a view'
    );
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it('persists view updates with a month key and creates the index once', async () => {
    const { recordListingView } = await import('../metrics/listing-views');
    const viewedAt = new Date('2024-03-10T08:15:30.000Z');

    await recordListingView('listing-123', viewedAt);

    expect(getCollectionMock).toHaveBeenCalledWith('listingViewMetrics');
    expect(mockCollection.createIndex).toHaveBeenCalledWith(
      { listingId: 1, month: 1 },
      { unique: true }
    );
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { listingId: 'listing-123', month: '2024-03' },
      {
        $inc: { viewCount: 1 },
        $set: { updatedAt: viewedAt },
        $setOnInsert: { createdAt: viewedAt },
      },
      { upsert: true }
    );

    await recordListingView('listing-999', new Date('2024-04-01T00:00:00.000Z'));
    expect(mockCollection.createIndex).toHaveBeenCalledTimes(1);
  });

  it('ignores already existing index errors from MongoDB', async () => {
    const interceptor = interceptIndexCatch(mockCollection);
    const { recordListingView } = await import('../metrics/listing-views');

    await recordListingView('listing-duplicate', new Date('2024-05-01T00:00:00.000Z'));

    expect(interceptor.handlerRegistered()).toBe(true);
    const result = interceptor.trigger(
      new Error('E11000 duplicate key error collection: listingViewMetrics index already exists')
    );
    expect(result).toBeUndefined();
  });

  it('propagates unexpected index creation errors', async () => {
    const interceptor = interceptIndexCatch(mockCollection);
    const { recordListingView } = await import('../metrics/listing-views');

    await recordListingView('listing-error', new Date('2024-06-01T00:00:00.000Z'));

    expect(interceptor.handlerRegistered()).toBe(true);
    expect(() => interceptor.trigger(new Error('network failure'))).toThrow('network failure');
  });
});

describe('getMonthlyViewCounts', () => {
  it('returns an empty map when no listingIds are provided', async () => {
    const { getMonthlyViewCounts } = await import('../metrics/listing-views');
    const result = await getMonthlyViewCounts([], ['2024-01']);
    expect(result.size).toBe(0);
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it('returns an empty map when no month keys are provided', async () => {
    const { getMonthlyViewCounts } = await import('../metrics/listing-views');
    const result = await getMonthlyViewCounts(['listing-1'], []);
    expect(result.size).toBe(0);
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it('maps view counts for each listing and month', async () => {
    findCursor.toArray.mockResolvedValueOnce([
      { listingId: 'listing-1', month: '2024-01', viewCount: 5 },
      { listingId: 'listing-1', month: '2024-02', viewCount: undefined },
      { listingId: 'listing-2', month: '2024-01', viewCount: 3 },
    ]);

    const { getMonthlyViewCounts } = await import('../metrics/listing-views');
    const result = await getMonthlyViewCounts(['listing-1', 'listing-2'], ['2024-01', '2024-02']);

    expect(mockCollection.find).toHaveBeenCalledWith({
      listingId: { $in: ['listing-1', 'listing-2'] },
      month: { $in: ['2024-01', '2024-02'] },
    });

    expect(result.get('listing-1')?.get('2024-01')).toBe(5);
    expect(result.get('listing-1')?.get('2024-02')).toBe(0);
    expect(result.get('listing-2')?.get('2024-01')).toBe(3);
  });
});

describe('getLifetimeViewCounts', () => {
  it('returns an empty map when there are no listingIds', async () => {
    const { getLifetimeViewCounts } = await import('../metrics/listing-views');
    const result = await getLifetimeViewCounts([]);
    expect(result.size).toBe(0);
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it('aggregates lifetime view counts per listing', async () => {
    aggregateCursor.toArray.mockResolvedValueOnce([
      { _id: 'listing-1', viewCount: 12 },
      { _id: 'listing-2', viewCount: undefined },
    ]);

    const { getLifetimeViewCounts } = await import('../metrics/listing-views');
    const listingIds = ['listing-1', 'listing-2'];
    const result = await getLifetimeViewCounts(listingIds);

    expect(mockCollection.aggregate).toHaveBeenCalledWith([
      { $match: { listingId: { $in: listingIds } } },
      { $group: { _id: '$listingId', viewCount: { $sum: '$viewCount' } } },
    ]);

    expect(result.get('listing-1')).toBe(12);
    expect(result.get('listing-2')).toBe(0);
  });
});
