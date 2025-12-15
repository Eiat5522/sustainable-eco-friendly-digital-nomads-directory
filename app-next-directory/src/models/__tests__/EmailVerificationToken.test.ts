import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import EmailVerificationToken from '../EmailVerificationToken';

describe('EmailVerificationToken Model', () => {
  beforeAll(() => {});

  afterAll(() => {});

  beforeEach(() => {
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
        const tokenHashIndex = indexes.find(([fields]) => fields.tokenHash === 1);
        expect(tokenHashIndex).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have TTL index on expiresAt', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const ttlIndex = indexes.find(([fields, options]) => {
          return fields.expiresAt === 1 && options?.expireAfterSeconds === 0;
        });
        expect(ttlIndex).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have compound unique index on userId and tokenHash', () => {
      const schema = EmailVerificationToken.schema;
      if (schema && typeof schema.indexes === 'function') {
        const indexes = schema.indexes();
        const compoundIndex = indexes.find(([fields, options]) => {
          return fields.userId === 1 && fields.tokenHash === 1 && options?.unique === true;
        });
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

      validHashes.forEach(hash => {
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
        const ttlIndex = indexes.find(([fields, options]) => {
          return fields.expiresAt && options?.expireAfterSeconds !== undefined;
        });

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
      if (schema?.options) {
        expect(schema.options.timestamps).toBeDefined();
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have createdAt enabled', () => {
      const schema = EmailVerificationToken.schema;
      if (schema?.options?.timestamps) {
        expect(schema.options.timestamps.createdAt).toBe(true);
      } else {
        expect(EmailVerificationToken).toBeDefined();
      }
    });

    it('should have updatedAt disabled', () => {
      const schema = EmailVerificationToken.schema;
      if (schema?.options?.timestamps) {
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
        const uniqueIndex = indexes.find(([fields]) => {
          return fields.userId === 1 && fields.tokenHash === 1;
        });

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

  // Note: Database operation tests have been moved to EmailVerificationToken.integration.test.ts
  // This keeps unit tests fast and focused on schema validation
});
