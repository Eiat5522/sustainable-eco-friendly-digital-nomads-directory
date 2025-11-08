import type { MockCollection } from '../db-helpers';

type MongoMockModule = {
  MongoClient: any;
  __mock: {
    connectMock: jest.Mock;
    dbMock: jest.Mock;
    reset: () => void;
    instances: any[];
  };
};

jest.mock('mongodb', () => {
  const connectMock = jest.fn();
  const dbMock = jest.fn();
  const instances: any[] = [];

  class MockMongoClient {
    public close = jest.fn().mockResolvedValue(undefined);

    constructor(public uri: string, public options: Record<string, unknown> = {}) {
      instances.push(this);
    }

    connect() {
      return connectMock.call(this);
    }

    db(name?: string) {
      return dbMock.call(this, name);
    }
  }

  const reset = () => {
    connectMock.mockImplementation(function (this: InstanceType<typeof MockMongoClient>) {
      return Promise.resolve(this);
    });
    dbMock.mockImplementation(() => ({
      collection: jest.fn(),
    }));
    instances.splice(0, instances.length);
  };

  reset();

  return {
    MongoClient: MockMongoClient,
    __mock: {
      connectMock,
      dbMock,
      reset,
      instances,
    },
  };
});

const ORIGINAL_ENV = { ...process.env };

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('db-helpers mock database behaviour', () => {
  beforeEach(() => {
    jest.resetModules();
    (jest.requireMock('mongodb') as MongoMockModule).__mock.reset();

    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'test' };
    delete process.env.ALLOW_REAL_MONGO_IN_TESTS;
    delete process.env.ALLOW_MONGO_IN_TESTS;
    delete process.env.ALLOW_MONGO_IN_TESTS;
    delete process.env.MOCK_MONGODB;
    delete process.env.MONGODB_URI;

    delete (globalThis as any).__TEST_MONGO_DB__;
    delete (globalThis as any)._mongoClientPromise;
  });

  it('returns consistent mock database and collection references', async () => {
    const { getDatabase, getCollection } = require('../db-helpers');

    const firstDb = await getDatabase();
    const secondDb = await getDatabase();
    expect(secondDb).toBe(firstDb);

    const firstCollection = (await getCollection('listings')) as MockCollection;
    const secondCollection = (await getCollection('listings')) as MockCollection;
    expect(secondCollection).toBe(firstCollection);
  });

  it('supports query modifiers, iteration, and aggregation in the mock collection', async () => {
    const { getCollection } = require('../db-helpers');
    const collection = (await getCollection('experiences')) as MockCollection;

    collection.__setDocuments([
      { _id: 'a1', name: 'A', status: 'active', stats: { rating: 4, views: 10 } },
      { _id: 'b2', name: 'B', status: 'archived', stats: { rating: 5, views: 20 } },
      { _id: 'c3', name: 'C', status: 'active', stats: { rating: 5, views: 5 } },
    ]);

    const cursor = collection.find({
      $and: [
        { status: { $ne: 'archived' } },
        { 'stats.rating': { $in: [4, 5] } },
        { $or: [{ name: 'A' }, { name: 'C' }] },
      ],
    });

    const projected = await cursor
      .sort({ 'stats.views': -1 })
      .skip(1)
      .limit(1)
      .project({ name: 1, 'stats.views': 1 })
      .toArray();

    expect(projected).toEqual([{ name: 'C', 'stats.views': 5 }]);

    const iterated: string[] = [];
    for await (const doc of collection.find({}).sort({ name: 1 })) {
      iterated.push((doc as any).name);
    }
    expect(iterated).toEqual(['A', 'B', 'C']);

    const found = await collection.findOne({ name: 'B' });
    expect(found).toEqual(expect.objectContaining({ _id: 'b2' }));

    await expect(collection.findOne({ name: 'missing' })).resolves.toBeNull();

    expect(await collection.countDocuments({ status: 'active' })).toBe(2);

    const aggregated = await collection
      .aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$status', totalViews: { $sum: '$stats.views' } } },
      ])
      .toArray();

    expect(aggregated).toEqual([{ _id: 'active', totalViews: 15 }]);
  });

  it('applies the same transformations for toArray and async iteration', async () => {
    const { getCollection } = require('../db-helpers');
    const collection = (await getCollection('experiences')) as MockCollection;

    collection.__setDocuments([
      { _id: 'one', name: 'One', status: 'active', stats: { views: 15 } },
      { _id: 'two', name: 'Two', status: 'active', stats: { views: 7 } },
      { _id: 'three', name: 'Three', status: 'inactive', stats: { views: 100 } },
      { _id: 'four', name: 'Four', status: 'active', stats: { views: 7 } },
    ]);

    const cursor = collection
      .find({ status: 'active' })
      .sort({ 'stats.views': -1, name: 1 })
      .project({ name: 1, 'stats.views': 1 })
      .limit(2);

    const arrayResults = await cursor.toArray();
    expect(arrayResults).toEqual([
      { name: 'One', 'stats.views': 15 },
      { name: 'Four', 'stats.views': 7 },
    ]);

    const iterated: Array<Record<string, unknown>> = [];
    for await (const doc of cursor) {
      iterated.push(doc as Record<string, unknown>);
    }

    expect(iterated).toEqual(arrayResults);
  });

  it('handles mutations, duplicate detection, and index creation in the mock collection', async () => {
    const { getCollection } = require('../db-helpers');
    const collection = (await getCollection('listings')) as MockCollection;

    collection.__setDocuments([{ _id: 'existing', name: 'Existing', stats: { views: 1 }, status: 'active' }]);

    const insertOneResult = await collection.insertOne({ name: 'New Listing' });
    expect(insertOneResult.acknowledged).toBe(true);
    expect(insertOneResult.insertedId).toMatch(/^mock_/);

    await expect(collection.insertOne({ _id: 'existing', name: 'Duplicate' })).rejects.toThrow(
      'E11000 duplicate key error: _id: existing',
    );

    await expect(
      collection.insertMany([
        { _id: 'alpha', name: 'Alpha' },
        { _id: 'existing', name: 'Duplicate existing' },
      ]),
    ).rejects.toThrow('E11000 duplicate key error: _id: existing');

    const updateResult = await collection.updateOne(
      { _id: 'existing' },
      { $set: { status: 'inactive' }, $inc: { 'stats.views': 2 } },
    );
    expect(updateResult).toEqual({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });

    const upsertResult = await collection.updateOne(
      { slug: 'generated' },
      { $setOnInsert: { name: 'Generated', stats: { views: 0 } }, $inc: { 'stats.views': 3 } },
      { upsert: true },
    );
    expect(upsertResult.acknowledged).toBe(true);
    expect(upsertResult.upsertedId?._id).toMatch(/^mock_/);

    const existingDoc = await collection.findOne({ _id: 'existing' });
    expect(existingDoc?.status).toBe('inactive');
    expect(existingDoc?.stats.views).toBe(3);

    const upsertedDoc = await collection.findOne({ slug: 'generated' });
    expect(upsertedDoc).toMatchObject({ name: 'Generated', stats: { views: 0 }, slug: 'generated' });

    const deleteResult = await collection.deleteOne({ _id: 'existing' });
    expect(deleteResult).toEqual({ acknowledged: true, deletedCount: 1 });
    await expect(collection.findOne({ _id: 'existing' })).resolves.toBeNull();

    const indexName = await collection.createIndex({ slug: 1 });
    expect(indexName).toBe('listings_mock_index');

    const indexNames = await collection.createIndexes([{ key: { slug: 1 } }, { key: { status: 1 } }]);
    expect(indexNames).toEqual(['listings_mock_index_0', 'listings_mock_index_1']);
  });

  it('rejects invalid collection names', async () => {
    const { getCollection } = require('../db-helpers');
    await expect(getCollection('invalid name!')).rejects.toThrow('Invalid collection name');
  });
});

describe('db-helpers real MongoClient pathway', () => {
  beforeEach(() => {
    jest.resetModules();
    (jest.requireMock('mongodb') as MongoMockModule).__mock.reset();

    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'test', ALLOW_REAL_MONGO_IN_TESTS: 'true', MONGODB_URI: 'mongodb://example' };

    delete (globalThis as any).__TEST_MONGO_DB__;
    delete (globalThis as any)._mongoClientPromise;
  });

  it('propagates connection failures from the MongoClient', async () => {
    const mongodbMock = jest.requireMock('mongodb') as MongoMockModule;
    mongodbMock.__mock.connectMock.mockImplementation(function () {
      return Promise.reject(new Error('connect failure'));
    });

    const { getDatabase } = require('../db-helpers');
    await expect(getDatabase()).rejects.toThrow('connect failure');
  });

  it('throws when the resolved client lacks a db function', async () => {
    const mongodbMock = jest.requireMock('mongodb') as MongoMockModule;
    mongodbMock.__mock.connectMock.mockImplementation(() => Promise.resolve({}));

    const { getDatabase } = require('../db-helpers');
    await expect(getDatabase()).rejects.toThrow('Client is not a valid MongoClient instance');
  });

  it('throws when the database object is invalid', async () => {
    const mongodbMock = jest.requireMock('mongodb') as MongoMockModule;
    mongodbMock.__mock.dbMock.mockImplementation(() => ({ collection: undefined }));

    const { getDatabase } = require('../db-helpers');
    await expect(getDatabase()).rejects.toThrow('Database instance is invalid');
  });

  it('returns a collection when the MongoClient resolves successfully', async () => {
    const mongodbMock = jest.requireMock('mongodb') as MongoMockModule;
    const collectionFn = jest.fn().mockReturnValue('realCollection');
    mongodbMock.__mock.dbMock.mockImplementation(() => ({ collection: collectionFn }));

    const { getCollection } = require('../db-helpers');
    const result = await getCollection('valid_name');

    expect(result).toBe('realCollection');
    expect(collectionFn).toHaveBeenCalledWith('valid_name');
  });
});

describe('initializeClientPromise validation', () => {
  beforeEach(() => {
    jest.resetModules();
    (jest.requireMock('mongodb') as MongoMockModule).__mock.reset();

    delete (globalThis as any).__TEST_MONGO_DB__;
    delete (globalThis as any)._mongoClientPromise;
  });

  it('instructs to use .env.development when NODE_ENV is development', () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'development', ALLOW_REAL_MONGO_IN_TESTS: 'true' };
    delete process.env.MONGODB_URI;

    expect(() => require('../db-helpers')).toThrow(
      'MongoDB URI is missing. Please set the MONGODB_URI environment variable in .env.development.',
    );
  });

  it('instructs to use .env.local when NODE_ENV is not development', () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production', ALLOW_REAL_MONGO_IN_TESTS: 'true' };
    delete process.env.MONGODB_URI;

    expect(() => require('../db-helpers')).toThrow(
      'MongoDB URI is missing. Please set the MONGODB_URI environment variable in .env.local.',
    );
  });
});
