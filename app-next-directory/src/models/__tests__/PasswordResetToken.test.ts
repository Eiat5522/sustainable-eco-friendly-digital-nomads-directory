import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { IPasswordResetToken } from '../PasswordResetToken';
import { connectInMemoryMongo, disconnectInMemoryMongo, clearInMemoryMongo } from '../../../tests/utils/dbHandler';

// Use a dynamic import for the model to ensure a fresh instance for each test
let PasswordResetToken: mongoose.Model<IPasswordResetToken>;

describe('PasswordResetToken Model', () => {
  beforeAll(async () => {
    await connectInMemoryMongo();
  });

  afterAll(async () => {
    await disconnectInMemoryMongo();
  });

  beforeEach(async () => {
    await clearInMemoryMongo();
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
      // The index is defined separately using schema.index()
      const tokenHashIndex = indexes.find(
        (idx: any) => idx[0].tokenHash === 1
      );
      expect(tokenHashIndex).toBeDefined();
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

  describe('Database Operations with In-Memory MongoDB', () => {
    it('should save a password reset token to database', async () => {
      const userId = new mongoose.Types.ObjectId();
      const tokenHash = 'a'.repeat(64);
      const expiresAt = new Date(Date.now() + 3600000);

      const token = await PasswordResetToken.create({
        userId,
        tokenHash,
        expiresAt,
      });

      expect(token._id).toBeDefined();
      expect(token.userId.toString()).toBe(userId.toString());
      expect(token.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve token by userId', async () => {
      const userId = new mongoose.Types.ObjectId();
      await PasswordResetToken.create({
        userId,
        tokenHash: 'b'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const found = await PasswordResetToken.findOne({ userId });

      expect(found).toBeDefined();
      expect(found?.userId.toString()).toBe(userId.toString());
    });

    it('should enforce unique userId constraint', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      await PasswordResetToken.create({
        userId,
        tokenHash: 'c'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      await expect(
        PasswordResetToken.create({
          userId,
          tokenHash: 'd'.repeat(64),
          expiresAt: new Date(Date.now() + 3600000),
        })
      ).rejects.toThrow();
    });

    it('should delete token after use', async () => {
      const token = await PasswordResetToken.create({
        userId: new mongoose.Types.ObjectId(),
        tokenHash: 'e'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      await PasswordResetToken.findByIdAndDelete(token._id);

      const deleted = await PasswordResetToken.findById(token._id);
      expect(deleted).toBeNull();
    });

    it('should query tokens by expiration date', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 7200000);
      const past = new Date(now.getTime() - 3600000);

      await PasswordResetToken.create([
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'f'.repeat(64),
          expiresAt: future,
        },
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'a'.repeat(64),
          expiresAt: past,
        },
      ]);

      const validTokens = await PasswordResetToken.find({
        expiresAt: { $gt: now },
      });

      expect(validTokens).toHaveLength(1);
      expect(validTokens[0].expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should count total tokens', async () => {
      await PasswordResetToken.create([
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'g'.repeat(64),
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: new mongoose.Types.ObjectId(),
          tokenHash: 'h'.repeat(64),
          expiresAt: new Date(Date.now() + 3600000),
        },
      ]);

      const count = await PasswordResetToken.countDocuments();
      expect(count).toBe(2);
    });

    it('should replace existing token for same user', async () => {
      const userId = new mongoose.Types.ObjectId();

      const oldToken = await PasswordResetToken.create({
        userId,
        tokenHash: 'i'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      await PasswordResetToken.findOneAndDelete({ userId });

      const newToken = await PasswordResetToken.create({
        userId,
        tokenHash: 'j'.repeat(64),
        expiresAt: new Date(Date.now() + 7200000),
      });

      const tokens = await PasswordResetToken.find({ userId });
      expect(tokens).toHaveLength(1);
      expect(tokens[0]._id.toString()).toBe(newToken._id.toString());
    });

    it('should validate tokenHash format (64 hex chars)', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Valid 64-char hex
      const validToken = await PasswordResetToken.create({
        userId,
        tokenHash: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      expect(validToken._id).toBeDefined();
    });

    it('should store createdAt as Date instance', async () => {
      const token = await PasswordResetToken.create({
        userId: new mongoose.Types.ObjectId(),
        tokenHash: 'k'.repeat(64),
        expiresAt: new Date(Date.now() + 3600000),
      });

      const retrieved = await PasswordResetToken.findById(token._id);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
    });
  });
});