// MongoDB client for NextAuth adapter
import { MongoClient } from 'mongodb';
import { initializeDatabase } from './mongodb/init';

let clientPromise: Promise<any>;

const shouldMockMongo = process.env.NODE_ENV === 'test' || process.env.E2E === '1';

// Skip MongoDB initialization in test/e2e environments
if (shouldMockMongo) {
  const mockClient = {
    db: () => ({
      createCollection: () => Promise.resolve(),
      collection: () => ({
        createIndexes: () => Promise.resolve(),
        findOne: () => Promise.resolve(),
        insertOne: () => Promise.resolve(),
        updateOne: () => Promise.resolve(),
        deleteOne: () => Promise.resolve(),
      }),
    }),
  };
  clientPromise = Promise.resolve(mockClient as any);
} else {
  if (!process.env.MONGODB_URI) {
    const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.local';
    throw new Error(`Please add your MongoDB URI to ${envFile}`);
  }

  const uri = process.env.MONGODB_URI;
  let client: MongoClient;

  // Connection options with proper timeouts
  const options = {
    serverSelectionTimeoutMS: 10000, // Reduce from 30s to 10s
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
  };

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect()
        .then(async (client) => {
          // Initialize database on first connection
          await initializeDatabase(client);
          return client;
        })
        .catch((error) => {
          // Clear the promise on error so next attempt can retry
          globalWithMongo._mongoClientPromise = undefined;
          console.error('MongoDB connection failed:', error.message);
          throw error;
        });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect()
      .then(async (client) => {
        // Initialize database on first connection
        await initializeDatabase(client);
        return client;
      })
      .catch((error) => {
        console.error('MongoDB connection failed:', error.message);
        throw error;
      });
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
