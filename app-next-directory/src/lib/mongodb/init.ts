import { MongoClient } from 'mongodb';
import { sessionSchema } from './schemas/session';

export async function initializeDatabase(client: MongoClient) {
  try {
    const db = client.db();

    // Create collections with schemas
    await db.createCollection('sessions', sessionSchema);
    
    // Create indexes
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { 'accounts.providerId': 1, 'accounts.providerAccountId': 1 }, unique: true },
    ]);

    await db.collection('loginAttempts').createIndexes([
      { key: { email: 1 } },
      { key: { createdAt: 1 }, expireAfterSeconds: 900 } // Auto-delete after 15 minutes
    ]);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
