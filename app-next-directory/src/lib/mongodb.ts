// Consolidated MongoDB client for the app
// Combines the richer TS implementation and test mock shapes from previous JS/TS duplicates.
import { MongoClient } from 'mongodb';

type MockCollection = {
  createIndexes?: (...args: any[]) => Promise<any>;
  createIndex?: (...args: any[]) => Promise<any>;
  findOne?: (...args: any[]) => Promise<any>;
  insertOne?: (...args: any[]) => Promise<any>;
  updateOne?: (...args: any[]) => Promise<any>;
  deleteOne?: (...args: any[]) => Promise<any>;
  findOneAndUpdate?: (...args: any[]) => Promise<any>;
  deleteMany?: (...args: any[]) => Promise<any>;
};

type MockDb = {
  createCollection?: (...args: any[]) => Promise<any>;
  collection: (name?: string) => MockCollection;
};

let clientPromise: Promise<any>;

const shouldMockMongo = process.env.NODE_ENV === 'test' || process.env.E2E === '1';

if (shouldMockMongo) {
  // In test environment, check if jest is available for enhanced mocking
  const useJestMocks = typeof jest !== 'undefined';
  
  // Create a mock collection that can be accessed and modified by tests
  const mockCollectionInstance = useJestMocks ? {
    createIndexes: jest.fn().mockResolvedValue({}),
    createIndex: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockResolvedValue(null),
    insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock' }),
    updateOne: jest.fn().mockResolvedValue({ matchedCount: 0, modifiedCount: 0 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    findOneAndUpdate: jest.fn().mockResolvedValue({ value: null }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  } : {
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
  } as { db: () => MockDb; _mockCollection?: typeof mockCollectionInstance };

  clientPromise = Promise.resolve(mockClient);
} else {
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
  } as any;

  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect()
        .then((clientInstance) => clientInstance)
        .catch((error) => {
          globalWithMongo._mongoClientPromise = undefined;
          console.error('MongoDB connection failed:', error?.message ?? error);
          throw error;
        });
    }
    clientPromise = globalWithMongo._mongoClientPromise as Promise<MongoClient>;
  } else {
    const client = new MongoClient(uri, options);
    clientPromise = client.connect()
      .then((clientInstance) => clientInstance)
      .catch((error) => {
        console.error('MongoDB connection failed:', error?.message ?? error);
        throw error;
      });
  }
}

export default clientPromise;
