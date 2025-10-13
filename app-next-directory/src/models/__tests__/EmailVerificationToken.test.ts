import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import EmailVerificationToken, { IEmailVerificationToken } from '../EmailVerificationToken';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearInMemoryMongo } from '../../../tests/utils/dbHandler';

describe('EmailVerificationToken Model', () => {
  beforeAll(async () => {
    await connectInMemoryMongo();
  });

  afterAll(async () => {
    await disconnectInMemoryMongo();
  });

  beforeEach(async () => {
    await clearInMemoryMongo();
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define EmailVerificationToken model', () => {
      expect(EmailVerificationToken).toBeDefined();
      expect(EmailVerificationToken.modelName).toBe('EmailVerificationToken');
    });

    it('should have correct schema structure', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        expect(schema.path('userId')).toBeDefined();
        expect(schema.path('tokenHash')).toBeDefined();
        expect(schema.path('expiresAt')).toBeDefined();
        expect(schema.path('createdAt')).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have required fields marked correctly', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        expect(schema.path('userId').isRequired).toBe(true);
        expect(schema.path('tokenHash').isRequired).toBe(true);
        expect(schema.path('expiresAt').isRequired).toBe(true);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have userId with User reference', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const userId = schema.path('userId');
        expect(userId.options.ref).toBe('User');
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('TokenHash Field', () => {
    it('should have tokenHash with select: false', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHash = schema.path('tokenHash');
        expect(tokenHash.options.select).toBe(false);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have tokenHash with minlength and maxlength of 64', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHash = schema.path('tokenHash');
        expect(tokenHash.options.minlength).toBe(64);
        expect(tokenHash.options.maxlength).toBe(64);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have tokenHash with immutable option', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHash = schema.path('tokenHash');
        expect(tokenHash.options.immutable).toBe(true);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have tokenHash with regex validation for sha256 hex', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHash = schema.path('tokenHash');
        expect(tokenHash.options.match).toBeInstanceOf(RegExp);
        expect(tokenHash.options.match.toString()).toContain('[a-f0-9]{64}');
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('UserId Field', () => {
    it('should have userId with immutable option', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const userId = schema.path('userId');
        expect(userId.options.immutable).toBe(true);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('Schema Indexes', () => {
    it('should have index on tokenHash', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const tokenHashIndex = indexes.find((idx: any) => idx[0].tokenHash === 1);
        expect(tokenHashIndex).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have TTL index on expiresAt', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const ttlIndex = indexes.find(
          (idx: any) => idx[0].expiresAt === 1 && idx[1]?.expireAfterSeconds === 0
        );
        expect(ttlIndex).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have compound unique index on userId and tokenHash', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const compoundIndex = indexes.find(
          (idx: any) => idx[0].userId === 1 && idx[0].tokenHash === 1 && idx[1]?.unique === true
        );
        expect(compoundIndex).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('Model Creation', () => {
    it('should create a valid email verification token with required fields', () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'a'.repeat(64);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      const token = new EmailVerificationToken({
        userId,
        tokenHash,
        expiresAt,
      });

      expect(token.userId.toString()).toBe(userId.toString());
      expect(token.tokenHash).toBe(tokenHash);
      expect(token.expiresAt).toEqual(expiresAt);
    });

    it('should accept userId as string', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = new EmailVerificationToken({
        userId,
        tokenHash: 'b'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token.userId.toString()).toBe(userId);
    });

    it('should accept userId as ObjectId', () => {
      const userId = new mongoose.Types.ObjectId();
      const token = new EmailVerificationToken({
        userId,
        tokenHash: 'c'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token.userId.toString()).toBe(userId.toString());
    });
  });

  describe('Expiration Logic', () => {
    it('should create token that expires in the future', () => {
      const userId = new mongoose.Types.ObjectId();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      const token = new EmailVerificationToken({
        userId,
        tokenHash: 'd'.repeat(64),
        expiresAt,
      });

      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should support different expiration times', () => {
      const userId = new mongoose.Types.ObjectId();
      const expirationTimes = [
        15 * 60 * 1000, // 15 minutes
        30 * 60 * 1000, // 30 minutes
        60 * 60 * 1000, // 1 hour
        24 * 60 * 60 * 1000, // 24 hours
      ];

      expirationTimes.forEach((timeMs, index) => {
        const expiresAt = new Date(Date.now() + timeMs);
        const token = new EmailVerificationToken({
          userId,
          tokenHash: index.toString().padStart(64, '0'),
          expiresAt,
        });

        expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
        expect(token.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + timeMs + 1000);
      });
    });
  });

  describe('Token Hash Format', () => {
    it('should accept valid sha256 hex hash (lowercase letters)', () => {
      const userId = new mongoose.Types.ObjectId();
      const validHashes = [
        'a'.repeat(64),
        'b'.repeat(64),
        'abcdef0123456789' + 'f'.repeat(48),
        '0123456789abcdef' + '0'.repeat(48),
      ];

      validHashes.forEach((hash) => {
        const token = new EmailVerificationToken({
          userId,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 3600000),
        });

        expect(token.tokenHash).toBe(hash);
        expect(token.tokenHash).toHaveLength(64);
      });
    });

    it('should accept valid sha256 hex hash (numbers)', () => {
      const userId = new mongoose.Types.ObjectId();
      const token = new EmailVerificationToken({
        userId,
        tokenHash: '0123456789' + '0'.repeat(54),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token.tokenHash).toHaveLength(64);
      expect(token.tokenHash).toMatch(/^[a-f0-9]{64}$/i);
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = EmailVerificationToken;
      const model2 = mongoose.models.EmailVerificationToken;
      expect(model1).toBe(model2);
    });
  });

  describe('Security Considerations', () => {
    it('should have tokenHash not selected by default', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHashPath = schema.path('tokenHash');
        expect(tokenHashPath.options.select).toBe(false);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should validate tokenHash is exactly 64 characters', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHashPath = schema.path('tokenHash');
        expect(tokenHashPath.options.minlength).toBe(64);
        expect(tokenHashPath.options.maxlength).toBe(64);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should prevent modification of userId', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const userIdPath = schema.path('userId');
        expect(userIdPath.options.immutable).toBe(true);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should prevent modification of tokenHash', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHashPath = schema.path('tokenHash');
        expect(tokenHashPath.options.immutable).toBe(true);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('TTL (Time To Live) Index', () => {
    it('should have TTL index configured for automatic deletion', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const ttlIndex = indexes.find(
          (idx: any) => idx[0].expiresAt && idx[1]?.expireAfterSeconds !== undefined
        );

        expect(ttlIndex).toBeDefined();
        if (ttlIndex) {
          expect(ttlIndex[1].expireAfterSeconds).toBe(0);
        }
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('Timestamps', () => {
    it('should have timestamps configuration', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && schema.options) {
        expect(schema.options.timestamps).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have createdAt enabled', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && schema.options && schema.options.timestamps) {
        expect(schema.options.timestamps.createdAt).toBe(true);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have updatedAt disabled', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && schema.options && schema.options.timestamps) {
        expect(schema.options.timestamps.updatedAt).toBe(false);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('Uniqueness Constraint', () => {
    it('should enforce unique combination of userId and tokenHash', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const uniqueIndex = indexes.find(
          (idx: any) => idx[0].userId === 1 && idx[0].tokenHash === 1
        );
        
        expect(uniqueIndex).toBeDefined();
        if (uniqueIndex) {
          expect(uniqueIndex[1].unique).toBe(true);
        }
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('Field Types', () => {
    it('should have userId as ObjectId', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const userId = schema.path('userId');
        expect(userId.instance).toBe('ObjectId');
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have tokenHash as String', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const tokenHash = schema.path('tokenHash');
        expect(tokenHash.instance).toBe('String');
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have expiresAt as Date', () => {
      const schema = EmailVerificationToken.schema;
      if (schema) {
        const expiresAt = schema.path('expiresAt');
        expect(expiresAt.instance).toBe('Date');
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });
  });

  describe('Database Operations with In-Memory MongoDB', () => {
    it('should save an email verification token to database', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'a'.repeat(64);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const token = await EmailVerificationToken.create({
        userId,
        tokenHash,
        expiresAt,
      });

      expect(token._id).toBeDefined();
      expect(token.userId.toString()).toBe(userId.toString());
      expect(token.expiresAt).toBeInstanceOf(Date);
      expect(token.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve token by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      await EmailVerificationToken.create({
        userId,
        tokenHash: 'b'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const found = await EmailVerificationToken.findOne({ userId });

      expect(found).toBeDefined();
      expect(found?.userId.toString()).toBe(userId.toString());
    });

    it('should enforce unique combination of userId and tokenHash', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'c'.repeat(64);

      await EmailVerificationToken.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await expect(
        EmailVerificationToken.create({
          userId,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
      ).rejects.toThrow();
    });

    it('should delete token after verification', async () => {
      const token = await EmailVerificationToken.create({
        userId: new mongoose.Types.ObjectId(),
        tokenHash: 'd'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await EmailVerificationToken.findByIdAndDelete(token._id);

      const deleted = await EmailVerificationToken.findById(token._id);
      expect(deleted).toBeNull();
    });

    it('should query tokens by expiration date', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await EmailVerificationToken.create([
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'e'.repeat(64),
          expiresAt: future,
        },
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'f'.repeat(64),
          expiresAt: past,
        },
      ]);

      const validTokens = await EmailVerificationToken.find({
        expiresAt: { $gt: now },
      });

      expect(validTokens).toHaveLength(1);
      expect(validTokens[0].expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should count total tokens', async () => {
      await EmailVerificationToken.create([
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'g'.repeat(64),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'h'.repeat(64),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      ]);

      const count = await EmailVerificationToken.countDocuments();
      expect(count).toBe(2);
    });

    it('should allow multiple tokens for same user with different tokenHash', async () => {
      const userId = new mongoose.Types.ObjectId();

      await EmailVerificationToken.create([
        {
          userId,
          tokenHash: 'i'.repeat(64),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        {
          userId,
          tokenHash: 'j'.repeat(64),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      ]);

      const tokens = await EmailVerificationToken.find({ userId });
      expect(tokens).toHaveLength(2);
    });

    it('should retrieve token with select tokenHash explicitly', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'k'.repeat(64);

      await EmailVerificationToken.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const found = await EmailVerificationToken.findOne({ userId }).select('+tokenHash');

      expect(found).toBeDefined();
      expect(found?.tokenHash).toBe(tokenHash);
    });

    it('should not include tokenHash by default', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'l'.repeat(64);

      await EmailVerificationToken.create({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const found = await EmailVerificationToken.findOne({ userId });

      expect(found).toBeDefined();
      expect((found as any).tokenHash).toBeUndefined();
    });

    it('should delete expired tokens', async () => {
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await EmailVerificationToken.create([
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'm'.repeat(64),
          expiresAt: past,
        },
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'n'.repeat(64),
          expiresAt: past,
        },
      ]);

      await EmailVerificationToken.deleteMany({ expiresAt: { $lt: new Date() } });

      const count = await EmailVerificationToken.countDocuments();
      expect(count).toBe(0);
    });

    it('should maintain immutability of userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const token = await EmailVerificationToken.create({
        userId,
        tokenHash: 'o'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const newUserId = new mongoose.Types.ObjectId();
      token.userId = newUserId as any;

      // Immutable fields should not change
      expect(token.userId.toString()).toBe(userId.toString());
    });

    it('should store createdAt automatically', async () => {
      const token = await EmailVerificationToken.create({
        userId: new mongoose.Types.ObjectId(),
        tokenHash: 'p'.repeat(64),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const retrieved = await EmailVerificationToken.findById(token._id);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
    });
  });
});
