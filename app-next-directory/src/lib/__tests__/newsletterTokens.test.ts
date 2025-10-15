import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const signMock = jest.fn();
const jwtVerifyMock = jest.fn();

jest.mock('jose', () => ({
  SignJWT: class {
    private payload: unknown;
    constructor(payload: unknown) {
      this.payload = payload;
    }
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    sign(key: Uint8Array) {
      return signMock(key, this.payload);
    }
  },
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
}));

describe('newsletterTokens', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    signMock.mockReset();
    jwtVerifyMock.mockReset();
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

  describe('success paths', () => {
    it('signs and verifies newsletter tokens when a strong secret is provided', async () => {
      process.env.NEXTAUTH_SECRET = 'a'.repeat(64);

      signMock.mockResolvedValue('signed-token');
      jwtVerifyMock.mockResolvedValue({ payload: { email: 'test@example.com ' } });

      const { signNewsletterConfirmToken, verifyNewsletterConfirmToken } = await import('../newsletterTokens');

      const token = await signNewsletterConfirmToken('test@example.com');

      expect(signMock).toHaveBeenCalledTimes(1);
      const [keyArg, payloadArg] = signMock.mock.calls[0];
      const expectedKey = new TextEncoder().encode('a'.repeat(64));
      expect(ArrayBuffer.isView(keyArg)).toBe(true);
      expect(keyArg).toEqual(expectedKey);
      expect(payloadArg).toEqual({ email: 'test@example.com' });

      const verified = await verifyNewsletterConfirmToken(token);

      expect(verified).toEqual({ email: 'test@example.com' });
      expect(jwtVerifyMock).toHaveBeenCalledTimes(1);
      const verifyArgs = jwtVerifyMock.mock.calls[0];
      expect(verifyArgs[0]).toBe('signed-token');
      expect(ArrayBuffer.isView(verifyArgs[1])).toBe(true);
      expect(verifyArgs[1]).toEqual(expectedKey);
      expect(verifyArgs[2]).toEqual({ algorithms: ['HS256'] });
    });

    it('throws when verified payload does not contain an email', async () => {
      process.env.NEXTAUTH_SECRET = 'b'.repeat(64);

      signMock.mockResolvedValue('bad-token');
      jwtVerifyMock.mockResolvedValue({ payload: {} });

      const { signNewsletterConfirmToken, verifyNewsletterConfirmToken } = await import('../newsletterTokens');

      const token = await signNewsletterConfirmToken('someone@example.com');

      await expect(verifyNewsletterConfirmToken(token)).rejects.toThrow('Invalid token payload');
    });
  });
});
