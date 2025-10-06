import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import PasswordResetToken, { IPasswordResetToken } from '../PasswordResetToken';

describe('PasswordResetToken Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define PasswordResetToken model', () => {
      expect(PasswordResetToken).toBeDefined();
      expect(PasswordResetToken.modelName).toBe('PasswordResetToken');
    });

    it('should have correct schema structure', () => {
      const schema = PasswordResetToken.schema;
      expect(schema.path('userId')).toBeDefined();
      expect(schema.path('tokenHash')).toBeDefined();
      expect(schema.path('expiresAt')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
    });

    it('should have required fields marked correctly', () => {
      expect(PasswordResetToken.schema.path('userId').isRequired).toBe(true);
      expect(PasswordResetToken.schema.path('tokenHash').isRequired).toBe(true);
      expect(PasswordResetToken.schema.path('expiresAt').isRequired).toBe(true);
    });

    it('should have userId with User reference', () => {
      const userId = PasswordResetToken.schema.path('userId');
      expect(userId.options.ref).toBe('User');
    });
  });

  describe('TokenHash Field', () => {
    it('should have tokenHash with select: false', () => {
      const tokenHash = PasswordResetToken.schema.path('tokenHash');
      expect(tokenHash.options.select).toBe(false);
    });

    it('should have tokenHash with minlength and maxlength of 64', () => {
      const tokenHash = PasswordResetToken.schema.path('tokenHash');
      expect(tokenHash.options.minlength).toBe(64);
      expect(tokenHash.options.maxlength).toBe(64);
    });

    it('should have tokenHash with lowercase option', () => {
      const tokenHash = PasswordResetToken.schema.path('tokenHash');
      expect(tokenHash.options.lowercase).toBe(true);
    });

    it('should have tokenHash with regex validation for sha256 hex', () => {
      const tokenHash = PasswordResetToken.schema.path('tokenHash');
      expect(tokenHash.options.match).toBeInstanceOf(RegExp);
      expect(tokenHash.options.match.toString()).toContain('[a-f0-9]{64}');
    });
  });

  describe('Schema Indexes', () => {
    it('should have unique index on userId', () => {
      const indexes = PasswordResetToken.schema.indexes();
      const userIdIndex = indexes.find(
        (idx: any) => idx[0].userId === 1 && idx[1]?.unique === true
      );
      expect(userIdIndex).toBeDefined();
    });

    it('should have index on tokenHash', () => {
      const indexes = PasswordResetToken.schema.indexes();
      const tokenHashIndex = indexes.find((idx: any) => idx[0].tokenHash === 1);
      expect(tokenHashIndex).toBeDefined();
    });

    it('should have TTL index on expiresAt', () => {
      const indexes = PasswordResetToken.schema.indexes();
      const ttlIndex = indexes.find(
        (idx: any) => idx[0].expiresAt === 1 && idx[1]?.expireAfterSeconds === 0
      );
      expect(ttlIndex).toBeDefined();
    });
  });

  describe('Model Creation', () => {
    it('should create a valid password reset token with required fields', () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'a'.repeat(64);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      const token = new PasswordResetToken({
        userId,
        tokenHash,
        expiresAt,
      });

      expect(token.userId).toEqual(userId);
      expect(token.tokenHash).toBe(tokenHash);
      expect(token.expiresAt).toEqual(expiresAt);
    });

    it('should set default createdAt value', () => {
      const userId = new mongoose.Types.ObjectId();
      const beforeCreation = new Date();
      
      const token = new PasswordResetToken({
        userId,
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });
      
      const afterCreation = new Date();

      expect(token.createdAt).toBeInstanceOf(Date);
      expect(token.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(token.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should accept userId as string', () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = new PasswordResetToken({
        userId,
        tokenHash: 'b'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token.userId.toString()).toBe(userId);
    });

    it('should accept userId as ObjectId', () => {
      const userId = new mongoose.Types.ObjectId();
      const token = new PasswordResetToken({
        userId,
        tokenHash: 'c'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token.userId).toEqual(userId);
    });

    it('should handle tokenHash with mixed case (converts to lowercase)', () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'ABCD' + 'e'.repeat(60);
      
      const token = new PasswordResetToken({
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token.tokenHash).toBe(tokenHash.toLowerCase());
    });
  });

  describe('Expiration Logic', () => {
    it('should create token that expires in the future', () => {
      const userId = new mongoose.Types.ObjectId();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      const token = new PasswordResetToken({
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
        const token = new PasswordResetToken({
          userId,
          tokenHash: index.toString().repeat(32),
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
        const token = new PasswordResetToken({
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
      const token = new PasswordResetToken({
        userId,
        tokenHash: '0123456789' + '0'.repeat(54),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token.tokenHash).toHaveLength(64);
      expect(token.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = PasswordResetToken;
      const model2 = mongoose.models.PasswordResetToken;
      expect(model1).toBe(model2);
    });
  });

  describe('One Token Per User Policy', () => {
    it('should enforce unique userId constraint (schema level)', () => {
      const schema = PasswordResetToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const uniqueUserIdIndex = indexes.find(
          (idx: any) => idx[0].userId === 1 && idx[1]?.unique === true
        );
        
        expect(uniqueUserIdIndex).toBeDefined();
        if (uniqueUserIdIndex) {
          expect(uniqueUserIdIndex[1].unique).toBe(true);
        }
      } else {
        expect(PasswordResetToken).toBeDefined();
      }
    });

    it('should allow creating token for different users', () => {
      const user1Id = new mongoose.Types.ObjectId();
      const user2Id = new mongoose.Types.ObjectId();

      const token1 = new PasswordResetToken({
        userId: user1Id,
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const token2 = new PasswordResetToken({
        userId: user2Id,
        tokenHash: 'b'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(token1.userId.toString()).toBe(user1Id.toString());
      expect(token2.userId.toString()).toBe(user2Id.toString());
      expect(token1.userId.toString()).not.toEqual(token2.userId.toString());
    });
  });

  describe('Security Considerations', () => {
    it('should have tokenHash not selected by default', () => {
      const schema = PasswordResetToken.schema;
      if (schema) {
        const tokenHashPath = schema.path('tokenHash');
        expect(tokenHashPath.options.select).toBe(false);
      } else {
        // Fallback: check that tokenHash exists on model
        expect(PasswordResetToken).toBeDefined();
      }
    });

    it('should validate tokenHash is exactly 64 characters', () => {
      const schema = PasswordResetToken.schema;
      if (schema) {
        const tokenHashPath = schema.path('tokenHash');
        expect(tokenHashPath.options.minlength).toBe(64);
        expect(tokenHashPath.options.maxlength).toBe(64);
      } else {
        expect(PasswordResetToken).toBeDefined();
      }
    });

    it('should validate tokenHash matches sha256 hex format', () => {
      const schema = PasswordResetToken.schema;
      if (schema) {
        const tokenHashPath = schema.path('tokenHash');
        const regex = tokenHashPath.options.match;
        
        // Valid hashes
        expect('a'.repeat(64)).toMatch(regex);
        expect('0123456789abcdef' + 'f'.repeat(48)).toMatch(regex);
        
        // Invalid hashes
        expect('g'.repeat(64)).not.toMatch(regex);
        expect('A'.repeat(64)).not.toMatch(regex);
        expect('a'.repeat(63)).not.toMatch(regex);
        expect('a'.repeat(65)).not.toMatch(regex);
      } else {
        expect(PasswordResetToken).toBeDefined();
      }
    });
  });

  describe('TTL (Time To Live) Index', () => {
    it('should have TTL index configured for automatic deletion', () => {
      const schema = PasswordResetToken.schema;
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
        expect(PasswordResetToken).toBeDefined();
      }
    });
  });
});
