// Consolidated MongoDB client for the app
// Combines the richer TS implementation and test mock shapes from previous JS/TS duplicates.
import { MongoClient, type MongoClientOptions } from 'mongodb';

type MockCollection = {
  createIndexes: (...args: unknown[]) => Promise<unknown>;
  findOne: (...args: unknown[]) => Promise<unknown>;
  insertOne: (...args: unknown[]) => Promise<{ insertedId: string }>;
  updateOne: (...args: unknown[]) => Promise<{ matchedCount: number; modifiedCount: number }>;
  deleteOne: (...args: unknown[]) => Promise<{ deletedCount: number }>;
};

type MockDb = {
  createCollection: (...args: unknown[]) => Promise<Record<string, never>>;
  collection: (...args: unknown[]) => MockCollection;
  command: (...args: unknown[]) => Promise<Record<string, unknown>>;
};

type MockMongoClient = {
  db: () => MockDb;
};

const shouldMockMongo = process.env.NODE_ENV === 'test' || process.env.E2E === '1';

let clientPromise: Promise<MongoClient>;

if (shouldMockMongo) {
  const mockClient: MockMongoClient = {
    db: () => ({
      createCollection: async () => ({}),
      collection: () => ({
        createIndexes: async () => ({}),
        findOne: async () => null,
        insertOne: async () => ({ insertedId: 'mock' }),
        updateOne: async () => ({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: async () => ({ deletedCount: 0 }),
      }),
      command: async () => ({}),
    }),
  };

  clientPromise = Promise.resolve(mockClient as unknown as MongoClient);
} else {
  const uri = process.env.MONGODB_URI;

  if (typeof uri !== 'string' || !/^mongodb(\+srv)?:\/\/.+/.test(uri)) {
    throw new Error('Please add a valid Mongo URI to .env.test');
  }

  const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
  };

  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  const createClient = () =>
    new MongoClient(uri, options)
      .connect()
      .catch((error) => {
        console.error('MongoDB connection failed:', error?.message ?? error);
        throw error;
      });

  if (process.env.NODE_ENV === 'development') {
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = createClient();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    clientPromise = createClient();
  }

  if (!clientPromise) {
    throw new Error('MongoDB client promise was not created');
  }
}

export default clientPromise;
