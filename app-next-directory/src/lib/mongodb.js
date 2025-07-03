import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI || typeof process.env.MONGODB_URI !== 'string' || !/^mongodb(\+srv)?:\/\/.+/.test(process.env.MONGODB_URI)) {
  throw new Error('Please add a valid Mongo URI to .env.test');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

try {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} catch (err) {
  throw new Error('Failed to initialize MongoDB client: ' + (err?.message || err));
}

if (!clientPromise) {
  throw new Error('MongoDB client promise was not created');
}

export default clientPromise;
