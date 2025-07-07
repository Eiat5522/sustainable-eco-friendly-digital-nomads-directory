import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MongoDB URI is missing. Please set the MONGODB_URI environment variable.');
}

let clientPromise: Promise<MongoClient> | undefined;

if (typeof window === 'undefined') {
  // On server: use a global variable to preserve value across hot reloads
  if (!(global as any)._mongoClientPromise) {
    (global as any)._mongoClientPromise = MongoClient.connect(uri, { });
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // On client: create a new client for every call (should not be used in browser)
  clientPromise = MongoClient.connect(uri, { });
}

export async function getDatabase(): Promise<Db> {
  if (!clientPromise) {
    throw new Error('MongoDB client is not initialized');
  }
  const client = await clientPromise;
  if (!client || typeof client.db !== 'function') {
    throw new Error('MongoDB client is invalid or not connected');
  }
  return client.db('sustainable-nomads');
}

export async function getCollection(name?: string): Promise<any> {
  if (!name || typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
    throw new Error('Invalid collection name');
  }
  const db = await getDatabase();
  if (!db || typeof db.collection !== 'function') {
    throw new Error('Database instance is invalid');
  }
  return db.collection(name);
}

export { clientPromise };
