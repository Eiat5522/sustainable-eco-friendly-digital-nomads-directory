import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.local';
  throw new Error(
    `Please define the MONGODB_URI environment variable inside ${envFile}`
  );
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached = (global as typeof globalThis & { mongoose?: MongooseCache }).mongoose;

if (!cached) {
  cached = ((global as typeof globalThis & { mongoose?: MongooseCache }).mongoose = { conn: null, promise: null });
}

async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null; // Reset the connection cache on error
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
