import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { IPasswordResetToken } from '../PasswordResetToken';

// Use a dynamic import for the model to ensure a fresh instance for each test
let PasswordResetToken: mongoose.Model<IPasswordResetToken>;

describe('PasswordResetToken Model', () => {
  beforeEach(async () => {
    jest.resetModules();
    // Re-import the model to get a fresh copy with the reset module cache
    const mod = await import('../PasswordResetToken');
    PasswordResetToken = mod.default;
  });

  describe('Schema Definition', () => {
    it('should have required fields marked correctly', () => {
      expect(PasswordResetToken.schema.path('userId').isRequired).toBe(true);
      expect(PasswordResetToken.schema.path('tokenHash').isRequired).toBe(true);
      expect(PasswordResetToken.schema.path('expiresAt').isRequired).toBe(true);
    });
  });

  describe('Schema Indexes', () => {
    it('should have a unique index on userId', () => {
      const indexes = (PasswordResetToken.schema as any).indexes();
      const userIdIndex = indexes.find(
        (idx: any) => idx[0].userId === 1 && idx[1]?.unique === true
      );
      expect(userIdIndex).toBeDefined();
    });

    it('should have an index on tokenHash', () => {
      const indexes = (PasswordResetToken.schema as any).indexes();
      // The index is defined inline, so we check the path options
      const tokenHashPath = PasswordResetToken.schema.path('tokenHash') as any;
      expect(tokenHashPath.options.index).toBe(true);
    });

    it('should have a TTL index on expiresAt', () => {
      const indexes = (PasswordResetToken.schema as any).indexes();
      const ttlIndex = indexes.find(
        (idx: any) => idx[0].expiresAt === 1 && idx[1]?.expireAfterSeconds === 0
      );
      expect(ttlIndex).toBeDefined();
    });
  });

  describe('Model Creation', () => {
    it('should create a valid password reset token', () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'a'.repeat(64);
      const expiresAt = new Date(Date.now() + 3600000);

      const token = new PasswordResetToken({
        userId,
        tokenHash,
        expiresAt,
      });

      expect(token.userId).toEqual(userId);
      expect(token.tokenHash).toBe(tokenHash);
      expect(token.expiresAt).toEqual(expiresAt);
    });

    it('should set default createdAt value as a Date instance', () => {
      const token = new PasswordResetToken({
        userId: new mongoose.Types.ObjectId(),
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });
      
      expect(token.createdAt).toBeInstanceOf(Date);
    });
  });
});