/**
 * Email utilities tests
 * 
 * Note: @/lib/email is globally mocked in jest.setup.ts, so we need to unmock it
 * to test the actual implementation.
 */

// Unmock the email module to test actual implementation
jest.unmock('@/lib/email');

// These mocks must be defined before importing the email module
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue(undefined) },
  })),
}));

jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn().mockResolvedValue('https://app.example.com'),
}));

describe('email utilities', () => {
  const originalEnv = process.env;
  let mockSend: jest.Mock;
  let ResendMock: jest.Mock;
  
  beforeAll(() => {
    // Set up valid environment before first import
    process.env = {
      ...originalEnv,
      RESEND_FROM: 'support@example.com',
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock for resend
    mockSend = jest.fn().mockResolvedValue(undefined);
    ResendMock = require('resend').Resend as jest.Mock;
    ResendMock.mockImplementation(() => ({
      emails: { send: mockSend },
    }));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendMail', () => {
    it('skips sending when API key is missing', async () => {
      // Remove API key for this test
      const envBackup = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;
      
      try {
        const { sendMail } = require('../email');
        const result = await sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' });

        expect(result).toEqual({ skipped: true });
      } finally {
        if (envBackup !== undefined) {
          process.env.RESEND_API_KEY = envBackup;
        }
      }
    });

    it('sends email using Resend when API key is configured', async () => {
      process.env.RESEND_API_KEY = 'test-api-key';
      
      // Force re-import to pick up the API key
      jest.resetModules();
      jest.unmock('@/lib/email');
      jest.doMock('resend', () => ({
        Resend: jest.fn().mockImplementation(() => ({
          emails: { send: mockSend },
        })),
      }));
      jest.doMock('@/lib/absolute-url', () => ({
        getBaseUrl: jest.fn().mockResolvedValue('https://app.example.com'),
      }));
      
      const { sendMail } = require('../email');
      const result = await sendMail({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<p>Hello</p>',
        text: 'Hello',
      });

      expect(result).toEqual({ sent: true });
    });
  });

  describe('email builders', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.unmock('@/lib/email');
      jest.doMock('resend', () => ({
        Resend: jest.fn().mockImplementation(() => ({
          emails: { send: jest.fn().mockResolvedValue(undefined) },
        })),
      }));
      jest.doMock('@/lib/absolute-url', () => ({
        getBaseUrl: jest.fn().mockResolvedValue('https://app.example.com'),
      }));
    });

    it('builds verification email payloads with encoded links', async () => {
      const { buildVerifyEmail } = require('../email');
      const payload = await buildVerifyEmail('user@example.com', 'token-123');

      expect(payload.link).toBe('https://app.example.com/api/auth/verify?token=token-123');
      expect(payload.html).toContain('Verify your email');
      expect(payload.text).toContain('token-123');
    });

    it('builds password reset email payloads', async () => {
      const { buildResetEmail } = require('../email');
      const payload = await buildResetEmail('user@example.com', 'reset-456');

      expect(payload.link).toBe('https://app.example.com/auth/reset?token=reset-456');
      expect(payload.subject).toBe('Reset your password');
      expect(payload.html).toContain('Reset password');
    });

    it('builds newsletter confirmation emails', async () => {
      const { buildNewsletterConfirmEmail } = require('../email');
      const payload = await buildNewsletterConfirmEmail('user@example.com', 'news-token');

      expect(payload).toMatchObject({
        to: 'user@example.com',
        subject: 'Confirm your newsletter subscription',
        link: 'https://app.example.com/api/newsletter/confirm?token=news-token',
      });
      expect(payload.html).toContain('Confirm your subscription');
    });
  });
});
