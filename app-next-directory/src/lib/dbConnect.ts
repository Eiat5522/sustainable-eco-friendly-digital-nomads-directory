import type { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
// Top-level MONGODB_URI check removed to allow dynamic import and test handling

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached = (global as typeof globalThis & { mongoose?: MongooseCache }).mongoose;

if (!cached) {
  cached = ((global as typeof globalThis & { mongoose?: MongooseCache }).mongoose = { conn: null, promise: null });
}

async function dbConnect(): Promise<Mongoose> {
  // Dynamically load mongoose for mocking flexibility
  const mongoose: any = require('mongoose');
  if (!MONGODB_URI || typeof MONGODB_URI !== 'string' || !/^mongodb(\+srv)?:\/\/.+/.test(MONGODB_URI)) {
    throw new Error('Invalid or missing MONGODB_URI');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      tlsAllowInvalidCertificates: process.env.NODE_ENV === "development",
      tls: true,
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance: typeof mongoose) => {
        // DEBUG: Log the returned mongooseInstance for troubleshooting
        // FORTEST: Remove this log after debugging
        // eslint-disable-next-line no-console
        console.log('DEBUG: mongoose.connect returned:', mongooseInstance);
        // Stricter validation: must be object and have readyState or connection.readyState
        if (
          !mongooseInstance ||
          typeof mongooseInstance !== 'object' ||
          (
            typeof (mongooseInstance as any).readyState !== 'number' &&
            (!('connection' in mongooseInstance) || typeof (mongooseInstance as any).connection.readyState !== 'number')
          )
        ) {
          throw new Error('Mongoose did not return a valid connection');
        }
        return mongooseInstance;
      });
    } catch (err) {
      cached.promise = null;
      throw new Error('Failed to connect to MongoDB: ' + (err instanceof Error ? err.message : err));
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null; // Reset the connection cache on error
    throw new Error('MongoDB connection error: ' + (e instanceof Error ? e.message : e));
  }

  if (!cached.conn) {
    throw new Error('MongoDB connection was not established');
  }

  return cached.conn;
}

export default dbConnect;

// Dummy comment to force TypeScript re-evaluation.
