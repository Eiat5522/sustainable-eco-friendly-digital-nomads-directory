import { MongoClient } from 'mongodb';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
}

export async function getDatabase() {
  if (!clientPromise) {
    throw new Error('MongoDB client is not initialized');
  }
  const client = await clientPromise;
  if (!client || typeof client.db !== 'function') {
    throw new Error('MongoDB client is invalid or not connected');
  }
  return client.db('sustainable-nomads');
}

export async function getCollection(collectionName: string) {
  if (!collectionName || typeof collectionName !== 'string' || !/^[a-zA-Z0-9-_]+$/.test(collectionName)) {
    throw new Error('Invalid collection name');
  }
  const db = await getDatabase();
  if (!db || typeof db.collection !== 'function') {
    throw new Error('Database instance is invalid');
  }
  return db.collection(collectionName);
}
