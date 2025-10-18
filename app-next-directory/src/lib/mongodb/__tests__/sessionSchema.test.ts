import { sessionSchema, sessionIndexes } from '../schemas/session';

describe('mongodb session schema', () => {
  it('defines the expected JSON schema validator', () => {
    expect(sessionSchema).toEqual(
      expect.objectContaining({
        validator: expect.objectContaining({
          $jsonSchema: expect.objectContaining({
            bsonType: 'object',
            required: ['sessionToken', 'userId', 'expires'],
            properties: expect.objectContaining({
              sessionToken: expect.objectContaining({ bsonType: 'string' }),
              userId: expect.objectContaining({ bsonType: 'string' }),
              expires: expect.objectContaining({ bsonType: 'date' }),
              lastAccessed: expect.objectContaining({ bsonType: 'date' }),
              userAgent: expect.objectContaining({ bsonType: 'string' }),
              ipAddress: expect.objectContaining({ bsonType: 'string' }),
            }),
          }),
        }),
      })
    );
  });

  it('lists indexes for token uniqueness, user lookups, and TTL expiry', () => {
    expect(sessionIndexes).toHaveLength(3);

    const tokenIndex = sessionIndexes.find((idx) => idx.key.sessionToken === 1);
    const userIndex = sessionIndexes.find((idx) => idx.key.userId === 1);
    const expiresIndex = sessionIndexes.find((idx) => idx.key.expires === 1);

    expect(tokenIndex).toEqual({ key: { sessionToken: 1 }, unique: true });
    expect(userIndex).toEqual({ key: { userId: 1 } });
    expect(expiresIndex).toEqual({ key: { expires: 1 }, expireAfterSeconds: 0 });
  });
});
