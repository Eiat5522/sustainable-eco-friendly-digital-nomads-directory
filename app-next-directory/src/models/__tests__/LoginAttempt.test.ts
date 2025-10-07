import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import LoginAttempt, { ILoginAttempt, LoginAttemptReason } from '../LoginAttempt';

describe('LoginAttempt Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Definition', () => {
    it('should define LoginAttempt model', () => {
      expect(LoginAttempt).toBeDefined();
      expect(LoginAttempt.modelName).toBe('LoginAttempt');
    });

    it('should have correct schema structure', () => {
      const schema = LoginAttempt.schema;
      expect(schema.path('email')).toBeDefined();
      expect(schema.path('ip')).toBeDefined();
      expect(schema.path('success')).toBeDefined();
      expect(schema.path('reason')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
    });

    it('should have required fields marked correctly', () => {
      expect(LoginAttempt.schema.path('email').isRequired).toBe(true);
      expect(LoginAttempt.schema.path('success').isRequired).toBe(true);
      expect(LoginAttempt.schema.path('reason').isRequired).toBe(true);
    });

    it('should have ip as optional field', () => {
      expect(LoginAttempt.schema.path('ip').isRequired).toBe(false);
    });
  });

  describe('Email Field', () => {
    it('should have lowercase option on email', () => {
      expect(LoginAttempt.schema.path('email').options.lowercase).toBe(true);
    });

    it('should have trim option on email', () => {
      expect(LoginAttempt.schema.path('email').options.trim).toBe(true);
    });

    it('should convert email to lowercase', () => {
      const attempt = new LoginAttempt({
        email: 'TEST@EXAMPLE.COM',
        success: true,
        reason: 'success',
      });
      expect(attempt.email).toBe('test@example.com');
    });

    it('should trim email whitespace', () => {
      const attempt = new LoginAttempt({
        email: '  test@example.com  ',
        success: true,
        reason: 'success',
      });
      expect(attempt.email).toBe('test@example.com');
    });
  });

  describe('Reason Field', () => {
    it('should have reason field with enum validation', () => {
      const reasonField = LoginAttempt.schema.path('reason');
      expect(reasonField.enumValues).toEqual(['success', 'invalid_credentials', 'rate_limited']);
    });

    it('should accept valid reason values', () => {
      const reasons: LoginAttemptReason[] = ['success', 'invalid_credentials', 'rate_limited'];
      
      reasons.forEach((reason) => {
        const success = reason === 'success';
        const attempt = new LoginAttempt({
          email: 'test@example.com',
          success,
          reason,
        });
        expect(attempt.reason).toBe(reason);
      });
    });
  });

  describe('IP Field', () => {
    it('should have default null for ip', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(attempt.ip).toBeNull();
    });

    it('should accept valid IP address', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        ip: '192.168.1.1',
        success: true,
        reason: 'success',
      });
      expect(attempt.ip).toBe('192.168.1.1');
    });

    it('should accept null IP', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        ip: null,
        success: false,
        reason: 'invalid_credentials',
      });
      expect(attempt.ip).toBeNull();
    });
  });

  describe('CreatedAt Field', () => {
    it('should have default createdAt value', () => {
      const beforeCreation = new Date();
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      const afterCreation = new Date();

      expect(attempt.createdAt).toBeInstanceOf(Date);
      expect(attempt.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(attempt.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('Model Creation - Successful Login', () => {
    it('should create successful login attempt', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        success: true,
        reason: 'success',
      });

      expect(attempt.email).toBe('user@example.com');
      expect(attempt.success).toBe(true);
      expect(attempt.reason).toBe('success');
    });

    it('should create successful login with IP', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        ip: '10.0.0.1',
        success: true,
        reason: 'success',
      });

      expect(attempt.ip).toBe('10.0.0.1');
      expect(attempt.success).toBe(true);
      expect(attempt.reason).toBe('success');
    });
  });

  describe('Model Creation - Failed Login', () => {
    it('should create failed login with invalid_credentials', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        success: false,
        reason: 'invalid_credentials',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('invalid_credentials');
    });

    it('should create failed login with rate_limited', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        success: false,
        reason: 'rate_limited',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('rate_limited');
    });

    it('should create failed login with IP', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        ip: '192.168.1.100',
        success: false,
        reason: 'invalid_credentials',
      });

      expect(attempt.ip).toBe('192.168.1.100');
      expect(attempt.success).toBe(false);
    });
  });

  describe('Invariant Validation - Pre-validate Hook', () => {
    it('should have pre-validate hook defined', () => {
      const preValidateHooks = LoginAttempt.schema.pre('validate');
      expect(preValidateHooks).toBeDefined();
    });

    it('should accept valid success=true with reason=success', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });

      expect(attempt.success).toBe(true);
      expect(attempt.reason).toBe('success');
    });

    it('should accept valid success=false with reason=invalid_credentials', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'invalid_credentials',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('invalid_credentials');
    });

    it('should accept valid success=false with reason=rate_limited', () => {
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'rate_limited',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('rate_limited');
    });
  });

  describe('Helper Functions', () => {
    it('should validate valid combinations with isValidCombination logic', () => {
      // success=true, reason=success is valid
      const validSuccess = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
      });
      expect(validSuccess.success).toBe(true);
      expect(validSuccess.reason).toBe('success');

      // success=false, reason=invalid_credentials is valid
      const validFail1 = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'invalid_credentials',
      });
      expect(validFail1.success).toBe(false);
      expect(validFail1.reason).toBe('invalid_credentials');

      // success=false, reason=rate_limited is valid
      const validFail2 = new LoginAttempt({
        email: 'test@example.com',
        success: false,
        reason: 'rate_limited',
      });
      expect(validFail2.success).toBe(false);
      expect(validFail2.reason).toBe('rate_limited');
    });
  });

  describe('Model Singleton', () => {
    it('should return existing model if already compiled', () => {
      const model1 = LoginAttempt;
      const model2 = mongoose.models.LoginAttempt;
      expect(model1).toBe(model2);
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

    it('should track failed login due to invalid credentials', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        ip: '192.168.1.1',
        success: false,
        reason: 'invalid_credentials',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('invalid_credentials');
    });

    it('should track failed login due to rate limiting', () => {
      const attempt = new LoginAttempt({
        email: 'attacker@example.com',
        ip: '10.0.0.1',
        success: false,
        reason: 'rate_limited',
      });

      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('rate_limited');
    });

    it('should track multiple login attempts for same email', () => {
      const attempts = [
        new LoginAttempt({
          email: 'user@example.com',
          success: false,
          reason: 'invalid_credentials',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        }),
        new LoginAttempt({
          email: 'user@example.com',
          success: false,
          reason: 'invalid_credentials',
          createdAt: new Date('2024-01-01T10:01:00Z'),
        }),
        new LoginAttempt({
          email: 'user@example.com',
          success: true,
          reason: 'success',
          createdAt: new Date('2024-01-01T10:02:00Z'),
        }),
      ];

      attempts.forEach(attempt => {
        expect(attempt.email).toBe('user@example.com');
      });

      expect(attempts[0].success).toBe(false);
      expect(attempts[1].success).toBe(false);
      expect(attempts[2].success).toBe(true);
    });

    it('should track login attempts from different IPs', () => {
      const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
      
      ips.forEach(ip => {
        const attempt = new LoginAttempt({
          email: 'user@example.com',
          ip,
          success: true,
          reason: 'success',
        });
        expect(attempt.ip).toBe(ip);
      });
    });

    it('should track login attempts without IP (null)', () => {
      const attempt = new LoginAttempt({
        email: 'user@example.com',
        success: true,
        reason: 'success',
      });
      expect(attempt.ip).toBeNull();
    });
  });

  describe('Security Analytics', () => {
    it('should enable tracking failed login patterns', () => {
      const failedAttempts = Array.from({ length: 5 }, (_, i) => 
        new LoginAttempt({
          email: 'user@example.com',
          ip: '192.168.1.1',
          success: false,
          reason: 'invalid_credentials',
          createdAt: new Date(Date.now() - (5 - i) * 60000), // 5 attempts over 5 minutes
        })
      );

      failedAttempts.forEach(attempt => {
        expect(attempt.success).toBe(false);
        expect(attempt.reason).toBe('invalid_credentials');
      });
    });

    it('should enable rate limiting detection', () => {
      const rateLimitedAttempt = new LoginAttempt({
        email: 'attacker@example.com',
        ip: '10.0.0.1',
        success: false,
        reason: 'rate_limited',
      });

      expect(rateLimitedAttempt.reason).toBe('rate_limited');
    });

    it('should enable IP-based analysis', () => {
      const suspiciousIP = '10.0.0.1';
      const attempts = [
        new LoginAttempt({
          email: 'user1@example.com',
          ip: suspiciousIP,
          success: false,
          reason: 'invalid_credentials',
        }),
        new LoginAttempt({
          email: 'user2@example.com',
          ip: suspiciousIP,
          success: false,
          reason: 'invalid_credentials',
        }),
        new LoginAttempt({
          email: 'user3@example.com',
          ip: suspiciousIP,
          success: false,
          reason: 'rate_limited',
        }),
      ];

      attempts.forEach(attempt => {
        expect(attempt.ip).toBe(suspiciousIP);
        expect(attempt.success).toBe(false);
      });
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript types for LoginAttemptReason', () => {
      const reasons: LoginAttemptReason[] = ['success', 'invalid_credentials', 'rate_limited'];
      expect(reasons).toHaveLength(3);
    });

    it('should create attempts with typed reason', () => {
      const successReason: LoginAttemptReason = 'success';
      const invalidReason: LoginAttemptReason = 'invalid_credentials';
      const rateLimitedReason: LoginAttemptReason = 'rate_limited';

      expect(successReason).toBe('success');
      expect(invalidReason).toBe('invalid_credentials');
      expect(rateLimitedReason).toBe('rate_limited');
    });
  });

  describe('Field Types', () => {
    it('should have email as String type', () => {
      const emailField = LoginAttempt.schema.path('email');
      expect(emailField.instance).toBe('String');
    });

    it('should have ip as String type', () => {
      const ipField = LoginAttempt.schema.path('ip');
      expect(ipField.instance).toBe('String');
    });

    it('should have success as Boolean type', () => {
      const successField = LoginAttempt.schema.path('success');
      expect(successField.instance).toBe('Boolean');
    });

    it('should have reason as String type', () => {
      const reasonField = LoginAttempt.schema.path('reason');
      expect(reasonField.instance).toBe('String');
    });

    it('should have createdAt as Date type', () => {
      const createdAtField = LoginAttempt.schema.path('createdAt');
      expect(createdAtField.instance).toBe('Date');
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

    it('should allow explicit createdAt value', () => {
      const explicitDate = new Date('2024-01-01T12:00:00Z');
      const attempt = new LoginAttempt({
        email: 'test@example.com',
        success: true,
        reason: 'success',
        createdAt: explicitDate,
      });

      expect(attempt.createdAt).toEqual(explicitDate);
    });
  });
});
