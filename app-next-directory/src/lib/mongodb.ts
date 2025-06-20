// MongoDB client for NextAuth adapter
import { MongoClient } from 'mongodb';
import { initializeDatabase } from './mongodb/init';

if (!process.env.MONGODB_URI) {
  const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.local';
  throw new Error(`Please add your MongoDB URI to ${envFile}`);
}

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect()
      .then(async (client) => {
        // Initialize database on first connection
        await initializeDatabase(client);
        return client;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect()
    .then(async (client) => {
      // Initialize database on first connection
      await initializeDatabase(client);
      return client;
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
