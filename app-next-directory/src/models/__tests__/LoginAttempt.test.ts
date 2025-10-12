import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { ILoginAttempt, LoginAttemptReason } from '../LoginAttempt';
import {
  connectInMemoryMongo,
  disconnectInMemoryMongo,
  clearInMemoryMongo,
} from '../../../tests/utils/dbHandler';

// Use a dynamic import for the model to ensure a fresh instance for each test
let LoginAttempt: mongoose.Model<ILoginAttempt>;

describe('LoginAttempt Model', () => {
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
    const mod = await import('../LoginAttempt');
    LoginAttempt = mod.default;
  });

  describe('Schema Definition', () => {
    it('should define LoginAttempt model', () => {
      expect(LoginAttempt).toBeDefined();
      expect(LoginAttempt.modelName).toBe('LoginAttempt');
    });

    it('should have required fields marked correctly', () => {
      expect(LoginAttempt.schema.path('email').isRequired).toBe(true);
      expect(LoginAttempt.schema.path('success').isRequired).toBe(true);
      expect(LoginAttempt.schema.path('reason').isRequired).toBe(true);
    });
  });

  describe('Email Field', () => {
    it('should convert email to lowercase and trim whitespace', () => {
      const attempt = new LoginAttempt({
        email: '  TEST@EXAMPLE.COM  ',
        success: true,
        reason: 'success',
      });
      expect(attempt.email).toBe('test@example.com');
    });

    it('should persist email with lowercase and trim applied', async () => {
      const attempt = await LoginAttempt.create({
        email: '  USER@EXAMPLE.COM  ',
        success: true,
        reason: 'success',
      });
      expect(attempt.email).toBe('user@example.com');
      
      const found = await LoginAttempt.findById(attempt._id);
      expect(found?.email).toBe('user@example.com');
    });
  });

  describe('Reason Field', () => {
    it('should have enum validation', () => {
      const reasonField = LoginAttempt.schema.path('reason');
      expect(reasonField.enumValues).toEqual(['success', 'invalid_credentials', 'rate_limited']);
    });

    it('should reject invalid reason values', async () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'invalid_reason' as LoginAttemptReason,
      });

      await expect(attempt.validate()).rejects.toThrow();
    });
  });

  describe('CreatedAt Field', () => {
    it('should have default createdAt value as a Date instance', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(attempt.createdAt).toBeInstanceOf(Date);
    });

    it('should automatically set createdAt on save', async () => {
      const before = new Date();
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      const after = new Date();

      expect(attempt.createdAt).toBeInstanceOf(Date);
      expect(attempt.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(attempt.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Validation Invariants', () => {
    it('should accept valid combination: success=true, reason=success', async () => {
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(attempt).toBeDefined();
    });

    it('should accept valid combination: success=false, reason=invalid_credentials', async () => {
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: false,
        reason: 'invalid_credentials',
      });
      expect(attempt).toBeDefined();
    });

    it('should accept valid combination: success=false, reason=rate_limited', async () => {
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: false,
        reason: 'rate_limited',
      });
      expect(attempt).toBeDefined();
    });

    it('should reject invalid combination: success=true, reason=invalid_credentials', async () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'invalid_credentials',
      });

      await expect(attempt.save()).rejects.toThrow(/Successful login attempts must use reason "success"/);
    });

    it('should reject invalid combination: success=false, reason=success', async () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'success',
      });

      await expect(attempt.save()).rejects.toThrow(/Failed login attempts cannot use reason "success"/);
    });
  });

  describe('Update Operations', () => {
    it('should allow updating with valid success/reason combination', async () => {
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: false,
        reason: 'invalid_credentials',
      });

      await LoginAttempt.updateOne(
        { _id: attempt._id },
        { success: false, reason: 'rate_limited' }
      );

      const updated = await LoginAttempt.findById(attempt._id);
      expect(updated?.reason).toBe('rate_limited');
    });

    it('should reject update with invalid combination', async () => {
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });

      await expect(
        LoginAttempt.updateOne(
          { _id: attempt._id },
          { success: false, reason: 'success' }
        )
      ).rejects.toThrow();
    });

    it('should reject unsetting required fields', async () => {
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });

      await expect(
        LoginAttempt.updateOne({ _id: attempt._id }, { $unset: { success: '' } })
      ).rejects.toThrow();
    });
  });

  describe('Use Cases', () => {
    it('should track successful login with IP', async () => {
      const attempt = await LoginAttempt.create({
        email: 'user@example.com',
        ip: '192.168.1.1',
        success: true,
        reason: 'success',
      });

      expect(attempt.success).toBe(true);
      expect(attempt.reason).toBe('success');
      expect(attempt.ip).toBe('192.168.1.1');
      expect(attempt.createdAt).toBeInstanceOf(Date);
    });

    it('should track failed login without IP', async () => {
      const attempt = await LoginAttempt.create({
        email: 'user@example.com',
        success: false,
        reason: 'invalid_credentials',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('invalid_credentials');
      expect(attempt.ip).toBeNull();
    });

    it('should track rate-limited attempts', async () => {
      const attempt = await LoginAttempt.create({
        email: 'user@example.com',
        ip: '10.0.0.1',
        success: false,
        reason: 'rate_limited',
      });

      expect(attempt.reason).toBe('rate_limited');
    });

    it('should query recent login attempts by email', async () => {
      await LoginAttempt.create({
        email: 'user@example.com',
        success: false,
        reason: 'invalid_credentials',
      });
      await LoginAttempt.create({
        email: 'user@example.com',
        success: true,
        reason: 'success',
      });

      const attempts = await LoginAttempt.find({ email: 'user@example.com' }).sort({ createdAt: -1 });
      expect(attempts).toHaveLength(2);
      expect(attempts[0].success).toBe(true);
      expect(attempts[1].success).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt on creation', async () => {
      const attempt = await LoginAttempt.create({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(attempt.createdAt).toBeInstanceOf(Date);
    });
  });
});