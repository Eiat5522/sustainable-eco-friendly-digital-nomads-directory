/**
 * Jest Test Suite for Contact API Route
 * Tests covering:
 * 1. GET /api/contact - Fetch contact form configuration
 * 2. POST /api/contact - Submit contact form with validation, rate limiting, and spam detection
 *
 * Uses mocked dependencies as per TEST_SETUP_GUIDE.md recommendations
 */

import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Create mock functions at the top level so they are shared across module reloads
const mockLimiterFn = jest.fn();
const transporterSendMail = jest.fn();

// Mock dependencies before importing the route
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/email', () => ({
  __esModule: true,
  sendMail: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
}));

jest.mock('@/utils/rate-limit', () => ({
  __esModule: true,
  rateLimit: jest.fn(() => mockLimiterFn),
}));

jest.mock('nodemailer', () => {
  const createTransport = jest.fn(() => ({ sendMail: transporterSendMail }));
  return {
    __esModule: true,
    default: { createTransport },
    createTransport,
  };
});

let GET: typeof import('./route').GET;
let POST: typeof import('./route').POST;
let dbConnect: jest.Mock;
let sendMail: jest.Mock;
let mockCreateTransport: jest.Mock;
let defaultGmailUser: string | undefined;
let defaultGmailPassword: string | undefined;

const originalSetImmediate = global.setImmediate;

beforeAll(async () => {
  process.env.CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'admin@example.com';
  process.env.SMTP_FROM = process.env.SMTP_FROM ?? 'noreply@example.com';
  process.env.GMAIL_USER = process.env.GMAIL_USER ?? 'gmail.user@example.com';
  process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD ?? 'gmail-app-password';

  ({ default: dbConnect } = (await import('@/lib/dbConnect')) as { default: jest.Mock });
  ({ sendMail } = (await import('@/lib/email')) as { sendMail: jest.Mock });
  const nodemailerModule = (await import('nodemailer')) as { createTransport: jest.Mock };
  mockCreateTransport = nodemailerModule.createTransport;
  ({ GET, POST } = await import('./route'));

  defaultGmailUser = process.env.GMAIL_USER;
  defaultGmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (typeof global.setImmediate !== 'function') {
    // jsdom does not provide setImmediate; nodemailer expects it to exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).setImmediate = (fn: (...args: unknown[]) => void, ...args: unknown[]) => {
      return setTimeout(() => fn(...args), 0);
    };
  }
});

afterAll(() => {
  delete process.env.CONTACT_EMAIL;
  delete process.env.SMTP_FROM;
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;

  if (originalSetImmediate) {
    global.setImmediate = originalSetImmediate;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).setImmediate;
  }
});

describe('Contact API', () => {
  const ORIGINAL_ENV = { ...process.env };

  describe('GET /api/contact', () => {
    describe('Configuration Endpoint', () => {
      it('should return contact form configuration', async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.types).toBeDefined();
        expect(Array.isArray(data.data.types)).toBe(true);
        expect(data.data.types.length).toBeGreaterThan(0);
        expect(data.data.limits).toBeDefined();
        expect(data.data.limits.rateLimit).toBe('5 requests per minute');
      });

      it('should include all contact types', async () => {
        const response = await GET();
        const data = await response.json();

        const typeValues = data.data.types.map((t: any) => t.value);
        expect(typeValues).toContain('general');
        expect(typeValues).toContain('listing');
        expect(typeValues).toContain('partnership');
        expect(typeValues).toContain('support');
        expect(typeValues).toContain('feedback');
      });

      it('should include field limits', async () => {
        const response = await GET();
        const data = await response.json();

        expect(data.data.limits.nameMax).toBe(100);
        expect(data.data.limits.subjectMax).toBe(200);
        expect(data.data.limits.messageMax).toBe(2000);
      });
    });
  });

  describe('POST /api/contact', () => {
    const validContactData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      subject: 'Test Subject',
      message: 'This is a test message with enough content to pass validation.',
      type: 'general',
    };

    let ipCounter = 0;
    const createPostRequest = (
      body: Record<string, unknown>,
      headers: Record<string, string> = {}
    ): NextRequest =>
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': `test-${++ipCounter}`,
          ...headers,
        },
        body: JSON.stringify(body),
      }) as NextRequest;

    const withIsolatedRoute = async (
      envOverrides: Record<string, string | undefined>,
      testFn: (module: typeof import('./route')) => Promise<void>
    ) => {
      const snapshotEnv = { ...process.env };

      const runner = async () => {
        const testEnv: Record<string, string> = { ...snapshotEnv };
        for (const [key, value] of Object.entries(envOverrides)) {
          if (typeof value === 'undefined') {
            delete testEnv[key];
          } else {
            testEnv[key] = value;
          }
        }

        process.env = testEnv;
        try {
          const module = await import('./route');
          await testFn(module);
        } finally {
          process.env = { ...snapshotEnv };
        }
      };

      const isolateAsync = (jest as unknown as {
        isolateModulesAsync?: <T>(fn: () => Promise<T>) => Promise<T>;
      }).isolateModulesAsync;

      if (typeof isolateAsync === 'function') {
        await isolateAsync(runner);
      } else {
        await new Promise<void>((resolve, reject) => {
          jest.isolateModules(() => {
            runner().then(resolve).catch(reject);
          });
        });
      }
    };

    beforeEach(() => {
      process.env = { ...ORIGINAL_ENV };
      // Clear mock call history (not implementation)
      mockLimiterFn.mockReset();
      mockLimiterFn.mockImplementation(async () => ({ success: true }));
      (dbConnect as jest.Mock).mockClear();
      (sendMail as jest.Mock).mockClear();
      mockCreateTransport.mockClear();

      // Reset mocks to default behavior (mockClear doesn't remove implementation)
      (dbConnect as jest.Mock).mockResolvedValue(undefined);
      (sendMail as jest.Mock).mockResolvedValue({ id: 'test-email-id' });
      transporterSendMail.mockReset();
      transporterSendMail.mockResolvedValue({ messageId: 'test-message-id' });
      // Don't reset mockLimiterFn here, it was set at mock creation time
    });

    afterEach(() => {
      process.env = { ...ORIGINAL_ENV };
    });

    describe('Successful Submissions', () => {
      it('should submit valid contact form', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        process.env.CONTACT_EMAIL = 'admin@example.com';

        const request = createPostRequest(validContactData, {
          'x-forwarded-for': '192.168.1.1',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('sent successfully');
        expect(data.data.submissionId).toBeDefined();
        expect(typeof data.data.submissionId).toBe('object'); // ObjectId is an object
        expect(dbConnect).toHaveBeenCalledTimes(1);
        expect(mockLimiterFn).toHaveBeenCalled();

        delete process.env.RESEND_API_KEY;
        delete process.env.CONTACT_EMAIL;
      });

      it('should handle listing-specific inquiries', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        const listingData = {
          ...validContactData,
          type: 'listing',
          listingSlug: 'eco-hostel-amsterdam',
        };

        const request = createPostRequest(listingData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.submissionId).toBeDefined();

        delete process.env.RESEND_API_KEY;
      });

      it('should accept contact form submission with Resend configured', async () => {
        process.env.RESEND_API_KEY = 'test-resend-key';

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.submissionId).toBeDefined();
        // Email sending is mocked, actual email testing requires integration tests
        expect(sendMail).toHaveBeenCalled();

        delete process.env.RESEND_API_KEY;
      });

      it('uses nodemailer transport when Resend is not configured', async () => {
        delete process.env.RESEND_API_KEY;
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_PORT = '465';
        process.env.SMTP_SECURE = 'true';
        process.env.SMTP_USER = 'smtp-user';
        process.env.SMTP_PASS = 'smtp-pass';
        process.env.SMTP_FROM = 'noreply@example.com';
        process.env.CONTACT_EMAIL = 'team@example.com';

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        transporterSendMail
          .mockResolvedValueOnce({ messageId: 'admin-id' })
          .mockResolvedValueOnce({ messageId: 'user-id' });
        mockCreateTransport.mockImplementationOnce(() => ({ sendMail: transporterSendMail }));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockCreateTransport).toHaveBeenCalledWith({
          host: 'smtp.example.com',
          port: 465,
          secure: true,
          auth: { user: 'smtp-user', pass: 'smtp-pass' },
        });
        expect(transporterSendMail).toHaveBeenCalledTimes(2);
        expect(sendMail).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });

      it('falls back to Gmail transport when SMTP credentials are missing', async () => {
        delete process.env.RESEND_API_KEY;
        delete process.env.SMTP_HOST;
        process.env.CONTACT_EMAIL = 'owner@example.com';

        transporterSendMail
          .mockResolvedValueOnce({ messageId: 'admin-id' })
          .mockResolvedValueOnce({ messageId: 'user-id' });
        mockCreateTransport.mockImplementationOnce(() => ({ sendMail: transporterSendMail }));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockCreateTransport).toHaveBeenCalledWith({
          service: 'gmail',
          auth: {
            user: defaultGmailUser,
            pass: defaultGmailPassword,
          },
        });
        expect(transporterSendMail).toHaveBeenCalledTimes(2);
      });

      it('warns when admin contact email is not configured', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        await withIsolatedRoute(
          {
            CONTACT_EMAIL: undefined,
            contactEmail: undefined,
            SMTP_USER: undefined,
            smtpUser: undefined,
            GMAIL_USER: undefined,
            gmailUser: undefined,
            RESEND_API_KEY: 'test-key',
          },
          async ({ POST: isolatedPost }) => {
            const request = createPostRequest(validContactData);
            const response = await isolatedPost(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(sendMail).toHaveBeenCalledTimes(1);
            expect(sendMail).toHaveBeenCalledWith(
              expect.objectContaining({ to: validContactData.email })
            );
          }
        );

        expect(warnSpy).toHaveBeenCalledWith(
          'No CONTACT_EMAIL configured; skipping admin notification email'
        );

        warnSpy.mockRestore();
      });

      it('uses Gmail user as the from address when MAIL_FROM is not set', async () => {
        const fallbackUser = 'gmail-fallback@example.com';
        const fallbackPassword = 'fallback-password';
        transporterSendMail
          .mockResolvedValueOnce({ messageId: 'admin-id' })
          .mockResolvedValueOnce({ messageId: 'user-id' });
        mockCreateTransport.mockImplementation(() => ({ sendMail: transporterSendMail }));

        await withIsolatedRoute(
          {
            RESEND_API_KEY: undefined,
            CONTACT_EMAIL: 'owner@example.com',
            contactEmail: 'owner@example.com',
            SMTP_HOST: undefined,
            SMTP_FROM: undefined,
            smtpFrom: undefined,
            SMTP_USER: undefined,
            smtpUser: undefined,
            GMAIL_USER: fallbackUser,
            gmailUser: fallbackUser,
            GMAIL_APP_PASSWORD: fallbackPassword,
          },
          async ({ POST: isolatedPost }) => {
            const request = createPostRequest(validContactData);
            const response = await isolatedPost(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(sendMail).not.toHaveBeenCalled();
            expect(transporterSendMail).toHaveBeenCalledTimes(2);

            const [adminArgs, autoReplyArgs] = transporterSendMail.mock.calls as [
              [
                {
                  from?: string;
                  to: string;
                }
              ],
              [
                {
                  from?: string;
                  to: string;
                }
              ]
            ];

            expect(adminArgs[0].from).toBe(fallbackUser);
            expect(autoReplyArgs[0].from).toBe(fallbackUser);
          }
        );
      });
    });

    describe('Validation Errors', () => {
      it('should reject submission with missing name', async () => {
        const invalidData = { ...validContactData, name: '' };

        const request = createPostRequest(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid form data');
        expect(dbConnect).toHaveBeenCalledTimes(1);
      });

      it('should reject submission with short name', async () => {
        const invalidData = { ...validContactData, name: 'A' };

        const request = createPostRequest(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with invalid email', async () => {
        const invalidData = { ...validContactData, email: 'invalid-email' };

        const request = createPostRequest(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid form data');
      });

      it('should reject submission with short subject', async () => {
        const invalidData = { ...validContactData, subject: 'Hi' };

        const request = createPostRequest(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with short message', async () => {
        const invalidData = { ...validContactData, message: 'Too short' };

        const request = createPostRequest(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with too long name', async () => {
        const invalidData = { ...validContactData, name: 'A'.repeat(101) };

        const request = createPostRequest(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with too long message', async () => {
        const invalidData = { ...validContactData, message: 'A'.repeat(2001) };

        const request = createPostRequest(invalidData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe('Rate Limiting', () => {
      it('should call rate limiter for each request', async () => {
        process.env.RESEND_API_KEY = 'test-key';

        const request = createPostRequest(validContactData);

        await POST(request);

        // Verify rate limiter was called
        expect(mockLimiterFn).toHaveBeenCalledWith(request);
        expect(mockLimiterFn).toHaveBeenCalledTimes(1);

        delete process.env.RESEND_API_KEY;
      });

      it('rejects requests that exceed the configured limit', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        mockLimiterFn.mockImplementationOnce(async () => ({ success: false }));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Too many requests. Please try again later.');

        delete process.env.RESEND_API_KEY;
      });
    });

    describe('Spam Detection', () => {
      it('should detect spam keywords in subject', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        const spamData = {
          ...validContactData,
          subject: 'Great casino opportunity for you',
        };

        const request = createPostRequest(spamData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.submissionId).toBeDefined();
        // Should not send email for spam
        expect(sendMail).not.toHaveBeenCalled();

        delete process.env.RESEND_API_KEY;
      });

      it('should detect spam keywords in message', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        const spamData = {
          ...validContactData,
          message: 'Invest in bitcoin now and get rich quick with our crypto scheme!',
        };

        const request = createPostRequest(spamData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.submissionId).toBeDefined();

        delete process.env.RESEND_API_KEY;
      });
    });

    describe('Error Handling', () => {
      it('should handle database connection errors', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (dbConnect as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Failed to send message');

        consoleErrorSpy.mockRestore();
      });

      it('should handle email sending errors with SMTP', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        process.env.RESEND_API_KEY = 'test-key';
        (sendMail as jest.Mock).mockRejectedValue(new Error('SMTP connection failed'));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Email service temporarily unavailable');

        delete process.env.RESEND_API_KEY;
        consoleErrorSpy.mockRestore();
      });

      it('should handle authentication errors', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        process.env.RESEND_API_KEY = 'test-key';
        (sendMail as jest.Mock).mockRejectedValue(new Error('Authentication failed'));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Email configuration error');

        delete process.env.RESEND_API_KEY;
        consoleErrorSpy.mockRestore();
      });

      it('maps nodemailer SMTP failures to a service unavailable response', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        delete process.env.RESEND_API_KEY;
        process.env.CONTACT_EMAIL = 'team@example.com';
        transporterSendMail.mockRejectedValue(new Error('SMTP timeout occurred'));
        mockCreateTransport.mockImplementationOnce(() => ({ sendMail: transporterSendMail }));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error).toContain('Email service temporarily unavailable');

        consoleErrorSpy.mockRestore();
      });

      it('returns configuration errors when nodemailer rejects with authentication issues', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        delete process.env.RESEND_API_KEY;
        process.env.CONTACT_EMAIL = 'team@example.com';
        transporterSendMail.mockRejectedValue(new Error('Authentication credentials invalid'));
        mockCreateTransport.mockImplementationOnce(() => ({ sendMail: transporterSendMail }));

        const request = createPostRequest(validContactData);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Email configuration error. Please contact support.');

        consoleErrorSpy.mockRestore();
      });
    });

    describe('Type Variations', () => {
      const contactTypes = ['general', 'listing', 'partnership', 'support', 'feedback'] as const;

      contactTypes.forEach((type) => {
        it(`should accept ${type} contact type`, async () => {
          mockLimiterFn.mockImplementation(async () => ({ success: true }));
          process.env.RESEND_API_KEY = 'test-key';
          const typeData = { ...validContactData, type };

          const request = createPostRequest(typeData);

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.submissionId).toBeDefined();

          delete process.env.RESEND_API_KEY;
        });
      });

      it('should default to general type when not specified', async () => {
        mockLimiterFn.mockImplementation(async () => ({ success: true }));
        process.env.RESEND_API_KEY = 'test-key';
        const { type, ...dataWithoutType } = validContactData;

        const request = createPostRequest(dataWithoutType);

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.submissionId).toBeDefined();

        delete process.env.RESEND_API_KEY;
      });
    });
  });
});
