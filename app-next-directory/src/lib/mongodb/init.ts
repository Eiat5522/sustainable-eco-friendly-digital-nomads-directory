import { type MongoClient, MongoServerError } from 'mongodb';
import { sessionSchema, sessionIndexes } from './schemas/session';

export async function initializeDatabase(client: MongoClient) {
  try {
    const db = client.db();

    // Create collections with schemas when they don't already exist
    try {
      await db.createCollection('sessions', sessionSchema);
    } catch (error) {
      if (!(error instanceof MongoServerError && error.code === 48)) {
        throw error;
      }
    }

    // Ensure session indexes exist independently of collection creation
    await db.collection('sessions').createIndexes(sessionIndexes);
    
    // Create indexes - Single source of truth for all index definitions
    await db.collection('users').createIndexes([
      { 
        key: { email: 1 }, 
        unique: true, 
        name: 'users_email_unique' // Explicit index name for better management
      },
      {
        key: { 'accounts.providerId': 1, 'accounts.providerAccountId': 1 },
        unique: true,
        name: 'users_accounts_provider_unique',
        partialFilterExpression: {
          'accounts.providerId': { $type: 'string' },
          'accounts.providerAccountId': { $type: 'string' },
        },
      },
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
