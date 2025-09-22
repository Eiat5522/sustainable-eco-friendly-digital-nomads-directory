import { jest } from '@jest/globals';

describe('auth config helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isEmailVerificationRequired', () => {
    it('honours explicit true override', () => {
      process.env.AUTH_REQUIRE_EMAIL_VERIFICATION = ' true ';

      jest.isolateModules(() => {
        const { isEmailVerificationRequired } = require('./config');
        expect(isEmailVerificationRequired()).toBe(true);
      });
    });

    it('honours explicit false override', () => {
      process.env.AUTH_REQUIRE_EMAIL_VERIFICATION = 'FALSE';
      process.env.RESEND_API_KEY = 'present';

      jest.isolateModules(() => {
        const { isEmailVerificationRequired } = require('./config');
        expect(isEmailVerificationRequired()).toBe(false);
      });
    });

    it('requires verification when transactional email key exists', () => {
      delete process.env.AUTH_REQUIRE_EMAIL_VERIFICATION;
      process.env.RESEND_API_KEY = 'key';

      jest.isolateModules(() => {
        const { isEmailVerificationRequired } = require('./config');
        expect(isEmailVerificationRequired()).toBe(true);
      });
    });

    it('defaults to false when no overrides are provided', () => {
      delete process.env.AUTH_REQUIRE_EMAIL_VERIFICATION;
      delete process.env.RESEND_API_KEY;

      jest.isolateModules(() => {
        const { isEmailVerificationRequired } = require('./config');
        expect(isEmailVerificationRequired()).toBe(false);
      });
    });
  });

  describe('admin email helpers', () => {
    it('parses and caches allowlisted emails', () => {
      process.env.AUTH_ADMIN_EMAILS = ' , Admin@Example.com, invalid, user@example.com';

      jest.isolateModules(() => {
        const { getAdminEmails } = require('./config');
        expect(getAdminEmails()).toEqual(['admin@example.com', 'user@example.com']);

        process.env.AUTH_ADMIN_EMAILS = 'other@example.com';
        expect(getAdminEmails()).toEqual(['admin@example.com', 'user@example.com']);
      });
    });

    it('rebuilds cache when module is reloaded', () => {
      process.env.AUTH_ADMIN_EMAILS = 'first@example.com';

      jest.isolateModules(() => {
        const { getAdminEmails } = require('./config');
        expect(getAdminEmails()).toEqual(['first@example.com']);
      });

      jest.resetModules();
      process.env.AUTH_ADMIN_EMAILS = 'second@example.com third@example.net';

      jest.isolateModules(() => {
        const { getAdminEmails } = require('./config');
        expect(getAdminEmails()).toEqual(['second@example.com', 'third@example.net']);
      });
    });

    it('matches admin emails case-insensitively and handles blanks', () => {
      process.env.AUTH_ADMIN_EMAILS = 'admin@example.com, another@example.com';

      jest.isolateModules(() => {
        const { isAdminEmail } = require('./config');

        expect(isAdminEmail(' ADMIN@example.com ')).toBe(true);
        expect(isAdminEmail('unknown@example.com')).toBe(false);
        expect(isAdminEmail('')).toBe(false);
        expect(isAdminEmail(null)).toBe(false);
        expect(isAdminEmail(undefined)).toBe(false);
      });
    });

    it('returns an empty list when no admin emails are configured', () => {
      delete process.env.AUTH_ADMIN_EMAILS;

      jest.isolateModules(() => {
        const { getAdminEmails } = require('./config');
        expect(getAdminEmails()).toEqual([]);
      });
    });
  });
});
