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
  });

  describe('Reason Field', () => {
    it('should have enum validation', () => {
      const reasonField = LoginAttempt.schema.path('reason');
      expect(reasonField.enumValues).toEqual(['success', 'invalid_credentials', 'rate_limited']);
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
  });

  describe('Use Cases', () => {
    it('should track successful login', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        ip: '192.168.1.1',
        success: true,
        reason: 'success',
      });

      expect(attempt.success).toBe(true);
      expect(attempt.reason).toBe('success');
      expect(attempt.createdAt).toBeInstanceOf(Date);
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
});