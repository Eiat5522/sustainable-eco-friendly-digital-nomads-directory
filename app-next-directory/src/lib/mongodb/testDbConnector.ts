// Test DB connector using only validated env vars.

import mongoose from 'mongoose';
import { getTestDbUri } from '../envLoader';

/**
 * Connects to the test MongoDB database using validated environment variables.
 * Ensures no hardcoded secrets and uses schema-validated env loading.
 */
export async function connectTestDb(): Promise<typeof mongoose | null> {
  const uri = getTestDbUri();
  if (!uri) {
    throw new Error('Test DB URI is not defined or invalid.');
  }
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  await mongoose.connect(uri, {
    dbName: 'test',
    // Add more options as needed, but do not hardcode secrets.
  });
  return mongoose;
}

/**
 * Disconnects from the test MongoDB database.
 */
export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}