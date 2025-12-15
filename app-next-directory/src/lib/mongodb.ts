// Consolidated MongoDB client for the app
// Combines the richer TS implementation and test mock shapes from previous JS/TS duplicates.
import { MongoClient, type MongoClientOptions } from 'mongodb';
import { structuredLogger } from '@/lib/logger';

type MockCollection = {
  createIndexes?: (...args: unknown[]) => Promise<unknown>;
  createIndex?: (...args: unknown[]) => Promise<unknown>;
  findOne?: (...args: unknown[]) => Promise<unknown>;
  insertOne?: (...args: unknown[]) => Promise<unknown>;
  updateOne?: (...args: unknown[]) => Promise<unknown>;
  deleteOne?: (...args: unknown[]) => Promise<unknown>;
  findOneAndUpdate?: (...args: unknown[]) => Promise<unknown>;
  deleteMany?: (...args: unknown[]) => Promise<unknown>;
};

type MockDb = {
  createCollection?: (...args: unknown[]) => Promise<unknown>;
  collection: (name?: string) => MockCollection;
};

// FORTEST: Lazy initialization to prevent module-scope network calls during build
let clientPromise: Promise<MongoClient> | null = null;

const allowRealMongoInTests =
  process.env.ALLOW_REAL_MONGO_IN_TESTS === 'true' || process.env.ALLOW_MONGO_IN_TESTS === 'true';
const shouldMockMongo =
  process.env.NODE_ENV === 'test' || (process.env.E2E === '1' && !allowRealMongoInTests);
const disableMongoDuringBuild =
  process.env.DISABLE_MONGODB_DURING_BUILD === '1' ||
  process.env.DISABLE_MONGODB_DURING_BUILD === 'true';

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  if (shouldMockMongo || disableMongoDuringBuild) {
    // Create a mock collection that tests can override
    // Use simple async functions that can be replaced by jest.fn() in tests
    const mockCollectionInstance: MockCollection = {
      createIndexes: async () => ({}),
      createIndex: async () => ({}),
      findOne: async () => null,
      insertOne: async () => ({ insertedId: 'mock' }),
      updateOne: async () => ({ matchedCount: 0, modifiedCount: 0 }),
      deleteOne: async () => ({ deletedCount: 0 }),
      findOneAndUpdate: async () => ({ value: null }),
      deleteMany: async () => ({ deletedCount: 0 }),
    };

    const mockClient = {
      db: () => ({
        createCollection: async () => ({}),
        collection: () => mockCollectionInstance,
      }),
      _mockCollection: mockCollectionInstance, // Expose for testing
    } as { db: () => MockDb; _mockCollection?: MockCollection };

    clientPromise = Promise.resolve(mockClient as unknown as MongoClient);
    return clientPromise;
  }

  if (!process.env.MONGODB_URI) {
    const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.local';
    throw new Error(`Please add your MongoDB URI to ${envFile}`);
  }

  const uri = process.env.MONGODB_URI;

  // Connection options with reasonable defaults
  const options = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
  } as MongoClientOptions;

  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client
        .connect()
        .then(clientInstance => clientInstance)
        .catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          structuredLogger.error('MongoDB connection failed', error, {
            component: 'mongodb',
            message,
          });
          globalWithMongo._mongoClientPromise = undefined;
          process.exit(1);
        });
    }
    clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>;
  } else {
    const client = new MongoClient(uri, options);
    clientPromise = client
      .connect()
      .then(clientInstance => clientInstance)
      .catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        structuredLogger.error('MongoDB connection failed', error, {
          component: 'mongodb',
          message,
        });
        process.exit(1);
      });
  }

  return clientPromise;
}

// FORTEST: Export a proper Promise that delegates to getClientPromise()
// This ensures full Promise compatibility including Symbol.toStringTag
const clientPromiseExport = new Promise<MongoClient>((resolve, reject) => {
  getClientPromise().then(resolve, reject);
});
export default clientPromiseExport;
