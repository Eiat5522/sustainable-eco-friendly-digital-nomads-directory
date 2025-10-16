import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

type MaybeMongo = MongoMemoryServer | null;

let mongoServer: MaybeMongo = null;

const isConnected = () => mongoose.connection.readyState === 1;

export const ensureInMemoryMongo = async (): Promise<string> => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }

  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  return uri;
};

export const connectInMemoryMongo = async (): Promise<typeof mongoose.connection> => {
  const uri = await ensureInMemoryMongo();
  if (!isConnected()) {
    await mongoose.connect(uri, { bufferCommands: false });
  }
  return mongoose.connection;
};

export const disconnectInMemoryMongo = async (): Promise<void> => {
  if (isConnected()) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const clearInMemoryMongo = async (): Promise<void> => {
  if (!isConnected()) return;

  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany({});
    })
  );
};

export const getMongoMemoryServer = (): MaybeMongo => mongoServer;