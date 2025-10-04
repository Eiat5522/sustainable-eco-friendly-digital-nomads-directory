import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('newsletterTokens', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('signNewsletterConfirmToken - error cases', () => {
    it('should throw error when secret is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.JWT_SECRET;
      
      const { signNewsletterConfirmToken } = require('../newsletterTokens');
      
      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });

    it('should throw error when secret is too short', async () => {
      process.env.NEXTAUTH_SECRET = 'tooshort';
      
      const { signNewsletterConfirmToken } = require('../newsletterTokens');
      
      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Newsletter token secret must be at least 32 characters'
      );
    });

    it('should throw error when secret is exactly 31 characters', async () => {
      process.env.NEXTAUTH_SECRET = 'a'.repeat(31);
      
      const { signNewsletterConfirmToken } = require('../newsletterTokens');
      
      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Newsletter token secret must be at least 32 characters'
      );
    });

    it('should throw error when secret is empty string', async () => {
      process.env.NEXTAUTH_SECRET = '';
      
      const { signNewsletterConfirmToken } = require('../newsletterTokens');
      
      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });
  });

  describe('verifyNewsletterConfirmToken - error cases', () => {
    it('should throw error when secret is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.JWT_SECRET;
      
      const { verifyNewsletterConfirmToken } = require('../newsletterTokens');
      
      await expect(verifyNewsletterConfirmToken('some.token.here')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });

    it('should throw error when secret is too short during verification', async () => {
      process.env.NEXTAUTH_SECRET = 'short';
      
      const { verifyNewsletterConfirmToken } = require('../newsletterTokens');
      
      await expect(verifyNewsletterConfirmToken('some.token.here')).rejects.toThrow(
        'Newsletter token secret must be at least 32 characters'
      );
    });

    it('should throw error when secret is empty during verification', async () => {
      process.env.NEXTAUTH_SECRET = '';
      
      const { verifyNewsletterConfirmToken } = require('../newsletterTokens');
      
      await expect(verifyNewsletterConfirmToken('some.token.here')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });
  });

  describe('module loading', () => {
    it('should not throw error on module load when secret is missing', () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.JWT_SECRET;
      
      // Should not throw on require
      expect(() => {
        require('../newsletterTokens');
      }).not.toThrow();
    });

    it('should not throw error on module load when secret is too short', () => {
      process.env.NEXTAUTH_SECRET = 'short';
      
      // Should not throw on require
      expect(() => {
        require('../newsletterTokens');
      }).not.toThrow();
    });
  });
});
