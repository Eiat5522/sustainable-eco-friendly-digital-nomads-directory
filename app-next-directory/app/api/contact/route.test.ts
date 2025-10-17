/**
 * Jest Test Suite for Contact API Route
 * Tests covering:
 * 1. GET /api/contact - Fetch contact form configuration
 * 2. POST /api/contact - Submit contact form with validation, rate limiting, and spam detection
 *
 * Uses mocked dependencies as per TEST_SETUP_GUIDE.md recommendations
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock dependencies before importing the route
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/email', () => ({
  __esModule: true,
  sendMail: jest.fn().mockResolvedValue({ id: 'test-email-id' }),
}));

// Create mock functions at the top level
const mockLimiterFn = jest.fn();

// Mock rate limiting - create a function that returns a function
jest.mock('@/utils/rate-limit', () => ({
  __esModule: true,
  rateLimit: jest.fn(() => mockLimiterFn),
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransporter: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    })),
  },
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

import { GET, POST } from './route';
import dbConnect from '@/lib/dbConnect';
import { sendMail } from '@/lib/email';

describe('Contact API', () => {
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

    beforeEach(() => {
      // Clear all mock call history
      jest.clearAllMocks();
      
      // Reset mock implementations completely
      mockLimiterFn.mockReset();
      
      // Reset mocks to default behavior
      (dbConnect as jest.Mock).mockResolvedValue(undefined);
      mockLimiterFn.mockResolvedValue({ success: true });
      (sendMail as jest.Mock).mockResolvedValue({ id: 'test-email-id' });
    });

    describe('Successful Submissions', () => {
      it('should submit valid contact form', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        process.env.CONTACT_EMAIL = 'admin@example.com';

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
          body: JSON.stringify(validContactData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('sent successfully');
        expect(data.data.submissionId).toBeDefined();
        expect(typeof data.data.submissionId).toBe('object'); // ObjectId is an object
        expect(dbConnect).toHaveBeenCalledTimes(1);

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

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listingData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.submissionId).toBeDefined();

        delete process.env.RESEND_API_KEY;
      });

      it('should send emails via Resend when configured', async () => {
        process.env.RESEND_API_KEY = 'test-resend-key';
        process.env.CONTACT_EMAIL = 'admin@example.com';

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validContactData),
        }) as NextRequest;

        await POST(request);

        expect(sendMail).toHaveBeenCalledTimes(2); // Admin notification + auto-reply
        expect(sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'admin@example.com',
            subject: expect.stringContaining('General Inquiry'),
          })
        );
        expect(sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: validContactData.email,
            subject: expect.stringContaining('Thank you'),
          })
        );

        delete process.env.RESEND_API_KEY;
        delete process.env.CONTACT_EMAIL;
      });
    });

    describe('Validation Errors', () => {
      it('should reject submission with missing name', async () => {
        const invalidData = { ...validContactData, name: '' };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid form data');
        expect(dbConnect).toHaveBeenCalledTimes(1);
      });

      it('should reject submission with short name', async () => {
        const invalidData = { ...validContactData, name: 'A' };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with invalid email', async () => {
        const invalidData = { ...validContactData, email: 'invalid-email' };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Invalid form data');
      });

      it('should reject submission with short subject', async () => {
        const invalidData = { ...validContactData, subject: 'Hi' };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with short message', async () => {
        const invalidData = { ...validContactData, message: 'Too short' };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with too long name', async () => {
        const invalidData = { ...validContactData, name: 'A'.repeat(101) };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should reject submission with too long message', async () => {
        const invalidData = { ...validContactData, message: 'A'.repeat(2001) };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe('Rate Limiting', () => {
      it('should enforce rate limits', async () => {
        mockLimiterFn.mockResolvedValueOnce({ success: false });

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validContactData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(429);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Too many requests');
        // Rate limit should prevent db connection
        expect(dbConnect).toHaveBeenCalledTimes(1);
      });
    });

    describe('Spam Detection', () => {
      it('should detect spam keywords in subject', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        const spamData = {
          ...validContactData,
          subject: 'Great casino opportunity for you',
        };

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(spamData),
        }) as NextRequest;

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

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(spamData),
        }) as NextRequest;

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
        (dbConnect as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validContactData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Failed to send message');
      });

      it('should handle email sending errors with SMTP', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        (sendMail as jest.Mock).mockRejectedValue(new Error('SMTP connection failed'));

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validContactData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Email service temporarily unavailable');

        delete process.env.RESEND_API_KEY;
      });

      it('should handle authentication errors', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        (sendMail as jest.Mock).mockRejectedValue(new Error('Authentication failed'));

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validContactData),
        }) as NextRequest;

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Email configuration error');

        delete process.env.RESEND_API_KEY;
      });
    });

    describe('Type Variations', () => {
      const contactTypes = ['general', 'listing', 'partnership', 'support', 'feedback'] as const;

      contactTypes.forEach((type) => {
        it(`should accept ${type} contact type`, async () => {
          process.env.RESEND_API_KEY = 'test-key';
          const typeData = { ...validContactData, type };

          const request = new Request('http://localhost/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(typeData),
          }) as NextRequest;

          const response = await POST(request);
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.submissionId).toBeDefined();

          delete process.env.RESEND_API_KEY;
        });
      });

      it('should default to general type when not specified', async () => {
        process.env.RESEND_API_KEY = 'test-key';
        const { type, ...dataWithoutType } = validContactData;

        const request = new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataWithoutType),
        }) as NextRequest;

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
