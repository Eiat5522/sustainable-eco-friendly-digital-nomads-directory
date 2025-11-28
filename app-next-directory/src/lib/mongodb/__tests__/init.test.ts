import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { MongoClient } from 'mongodb';
import { MongoServerError } from 'mongodb';
import { structuredLogger } from '@/lib/logger';
import { initializeDatabase } from '../init';
import { sessionIndexes, sessionSchema } from '../schemas/session';

type MockedCollection = {
  createIndexes: jest.Mock;
};

type MockedDb = {
  createCollection: jest.Mock;
  collection: jest.Mock;
};

describe('initializeDatabase', () => {
  let mockClient: Pick<MongoClient, 'db'>;
  let mockDb: MockedDb;
  let sessionsCollection: MockedCollection;
  let usersCollection: MockedCollection;
  let loginAttemptsCollection: MockedCollection;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    sessionsCollection = { createIndexes: jest.fn().mockResolvedValue(undefined) };
    usersCollection = { createIndexes: jest.fn().mockResolvedValue(undefined) };
    loginAttemptsCollection = { createIndexes: jest.fn().mockResolvedValue(undefined) };

    mockDb = {
      createCollection: jest.fn().mockResolvedValue(undefined),
      collection: jest.fn((name: string) => {
        switch (name) {
          case 'sessions':
            return sessionsCollection;
          case 'users':
            return usersCollection;
          case 'loginAttempts':
            return loginAttemptsCollection;
          default:
            throw new Error(`Unexpected collection requested: ${name}`);
        }
      }),
    };

    mockClient = {
      db: jest.fn().mockReturnValue(mockDb),
    } as unknown as Pick<MongoClient, 'db'>;

    logSpy = jest.spyOn(structuredLogger, 'info').mockImplementation(() => {});
    errorSpy = jest.spyOn(structuredLogger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates the sessions collection, indexes, and other index definitions', async () => {
    await initializeDatabase(mockClient as MongoClient);

    expect(mockClient.db).toHaveBeenCalledTimes(1);
    expect(mockDb.createCollection).toHaveBeenCalledWith('sessions', sessionSchema);
    expect(mockDb.collection).toHaveBeenCalledTimes(3);
    expect(sessionsCollection.createIndexes).toHaveBeenCalledWith(sessionIndexes);
    expect(usersCollection.createIndexes).toHaveBeenCalledWith([
      {
        key: { email: 1 },
        unique: true,
        name: 'users_email_unique',
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
    expect(loginAttemptsCollection.createIndexes).toHaveBeenCalledWith([
      { key: { email: 1 } },
      { key: { createdAt: 1 }, expireAfterSeconds: 900 },
    ]);
    expect(logSpy).toHaveBeenCalledWith('Database initialization completed successfully');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('continues when the sessions collection already exists', async () => {
    const existingCollectionError = new MongoServerError({
      errmsg: 'Collection already exists',
      code: 48,
    } as unknown as ConstructorParameters<typeof MongoServerError>[0]);

    mockDb.createCollection.mockRejectedValueOnce(existingCollectionError);

    await initializeDatabase(mockClient as MongoClient);

    expect(sessionsCollection.createIndexes).toHaveBeenCalledWith(sessionIndexes);
    expect(logSpy).toHaveBeenCalledWith('Database initialization completed successfully');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs and rethrows unexpected errors', async () => {
    const failure = new Error('boom');
    mockDb.createCollection.mockRejectedValueOnce(failure);

    await expect(initializeDatabase(mockClient as MongoClient)).rejects.toThrow(failure);

    expect(errorSpy).toHaveBeenCalledWith('Error initializing database:', failure);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
