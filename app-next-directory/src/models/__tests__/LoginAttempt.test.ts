import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { ILoginAttempt, LoginAttemptReason } from '../LoginAttempt';

// Use a dynamic import for the model to ensure a fresh instance for each test
let LoginAttempt: mongoose.Model<ILoginAttempt>;

describe('LoginAttempt Model', () => {
  beforeEach(async () => {
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

    it('should handle various email formats correctly', () => {
      const testCases = [
        { input: 'USER@EXAMPLE.COM', expected: 'user@example.com' },
        { input: '  user@example.com  ', expected: 'user@example.com' },
        { input: 'User@Example.Com', expected: 'user@example.com' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const attempt = new LoginAttempt({
          email: input,
          success: true,
          reason: 'success',
        });
        expect(attempt.email).toBe(expected);
      });
    });
  });

  describe('Reason Field', () => {
    it('should have enum validation', () => {
      const reasonField = LoginAttempt.schema.path('reason');
      expect(reasonField.enumValues).toEqual(['success', 'invalid_credentials', 'rate_limited']);
    });

    it('should accept all valid reason values', () => {
      const validReasons: LoginAttemptReason[] = ['success', 'invalid_credentials', 'rate_limited'];
      
      validReasons.forEach(reason => {
        const attempt = new LoginAttempt({
          email: 'test@example.com',
          success: reason === 'success',
          reason,
        });
        expect(attempt.reason).toBe(reason);
      });
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

    it('should set createdAt within reasonable time range', () => {
      const before = new Date();
      const attempt = new LoginAttempt({
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
    it('should accept valid combination: success=true, reason=success', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(attempt.success).toBe(true);
      expect(attempt.reason).toBe('success');
    });

    it('should accept valid combination: success=false, reason=invalid_credentials', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'invalid_credentials',
      });
      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('invalid_credentials');
    });

    it('should accept valid combination: success=false, reason=rate_limited', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'rate_limited',
      });
      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('rate_limited');
    });
  });

  describe('Use Cases', () => {
    it('should track successful login with IP', () => {
      const attempt = new LoginAttempt({
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

    it('should track failed login without IP', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        success: false,
        reason: 'invalid_credentials',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('invalid_credentials');
      expect(attempt.ip).toBeNull();
    });

    it('should track rate-limited attempts', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        ip: '10.0.0.1',
        success: false,
        reason: 'rate_limited',
      });

      expect(attempt.reason).toBe('rate_limited');
      expect(attempt.ip).toBe('10.0.0.1');
    });

    it('should have IP as optional field with null default', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        success: false,
        reason: 'invalid_credentials',
      });

      expect(attempt.ip).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt on creation', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(attempt.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Model Methods', () => {
    it('should have save method', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(typeof attempt.save).toBe('function');
    });

    it('should have validate method', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(typeof attempt.validate).toBe('function');
    });
  });
});