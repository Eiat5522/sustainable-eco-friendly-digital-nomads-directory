/**
 * Test Suite for Newsletter Confirmation API Route
 * Tests covering:
 * 1. GET /api/newsletter/confirm - Confirm newsletter subscription
 * 2. Token verification
 * 3. Database operations
 * 4. Redirect behavior
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextResponse } from 'next/server';

// Mock dbConnect
const mockDbConnect = jest.fn();
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: mockDbConnect,
}));

// Mock NewsletterSubscriber model
const mockUpdateOne = jest.fn();
const MockNewsletterSubscriber = {
  updateOne: mockUpdateOne,
};
jest.mock('@/models/NewsletterSubscriber', () => ({
  __esModule: true,
  default: MockNewsletterSubscriber,
}));

// Mock token verification
const mockVerifyToken = jest.fn();
jest.mock('@/lib/newsletterTokens', () => ({
  __esModule: true,
  verifyNewsletterConfirmToken: mockVerifyToken,
}));

let GET: typeof import('../route').GET;

describe('Newsletter Confirmation API - GET /api/newsletter/confirm', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockDbConnect.mockResolvedValue(undefined);
    mockUpdateOne.mockResolvedValue({ acknowledged: true });
    
    // Dynamically import the route handler
    const module = await import('../route');
    GET = module.GET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Successful Confirmation', () => {
    it('should confirm subscription with valid token', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: 'test@example.com' });

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      const response = await GET(request);

      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=success');
      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { $set: { email: 'test@example.com', confirmedAt: expect.any(Date) } },
        { upsert: true }
      );
    });

    it('should normalize email to lowercase and trim', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: '  TEST@EXAMPLE.COM  ' });

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      await GET(request);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        { $set: { email: 'test@example.com', confirmedAt: expect.any(Date) } },
        { upsert: true }
      );
    });

    it('should handle confirmation without MONGODB_URI in development', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.MONGODB_URI;
      mockVerifyToken.mockResolvedValueOnce({ email: 'test@example.com' });

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=success');
      expect(mockDbConnect).not.toHaveBeenCalled();
      expect(mockUpdateOne).not.toHaveBeenCalled();
    });

    it('should handle confirmation without MONGODB_URI in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.MONGODB_URI;
      mockVerifyToken.mockResolvedValueOnce({ email: 'test@example.com' });

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=server');
      expect(mockDbConnect).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should redirect to missing status when token is missing', async () => {
      const request = new Request('http://localhost/api/newsletter/confirm');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=missing');
      expect(mockVerifyToken).not.toHaveBeenCalled();
    });

    it('should redirect to invalid status when token verification fails', async () => {
      mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));

      const request = new Request('http://localhost/api/newsletter/confirm?token=invalid-token');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=invalid');
      expect(mockDbConnect).not.toHaveBeenCalled();
      expect(mockUpdateOne).not.toHaveBeenCalled();
    });

    it('should redirect to invalid status when token is expired', async () => {
      mockVerifyToken.mockRejectedValueOnce(new Error('Token expired'));

      const request = new Request('http://localhost/api/newsletter/confirm?token=expired-token');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=invalid');
    });

    it('should handle database connection errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: 'test@example.com' });
      mockDbConnect.mockRejectedValueOnce(new Error('Connection failed'));

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=invalid');
    });

    it('should handle database update errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: 'test@example.com' });
      mockUpdateOne.mockRejectedValueOnce(new Error('Update failed'));

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=invalid');
    });

    it('should handle malformed URL errors', async () => {
      mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));

      // Create a request with potentially problematic URL
      const request = new Request('http://localhost/api/newsletter/confirm?token=bad%token');

      const response = await GET(request);

      expect(response.status).toBe(307);
      // Should have a fallback redirect
      expect(response.headers.get('location')).toBeTruthy();
    });
  });

  describe('Token Validation', () => {
    it('should handle empty token parameter', async () => {
      const request = new Request('http://localhost/api/newsletter/confirm?token=');

      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/newsletter/confirmed?status=missing');
    });

    it('should handle token with special characters', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: 'test@example.com' });

      const request = new Request('http://localhost/api/newsletter/confirm?token=abc-123_xyz.token');

      const response = await GET(request);

      expect(mockVerifyToken).toHaveBeenCalledWith('abc-123_xyz.token');
    });
  });

  describe('Email Handling', () => {
    it('should handle email with plus addressing', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: 'user+newsletter@example.com' });

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      await GET(request);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { email: 'user+newsletter@example.com' },
        expect.any(Object),
        { upsert: true }
      );
    });

    it('should handle email with subdomain', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: 'user@mail.example.com' });

      const request = new Request('http://localhost/api/newsletter/confirm?token=valid-token');

      await GET(request);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { email: 'user@mail.example.com' },
        expect.any(Object),
        { upsert: true }
      );
    });
  });

  describe('Redirect Behavior', () => {
    it('should use origin from request URL for redirect', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost/test';
      mockVerifyToken.mockResolvedValueOnce({ email: 'test@example.com' });

      const request = new Request('https://example.com/api/newsletter/confirm?token=valid-token');

      const response = await GET(request);

      expect(response.headers.get('location')).toContain('https://example.com/newsletter/confirmed');
    });

    it('should maintain https protocol in redirect', async () => {
      mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));

      const request = new Request('https://secure.example.com/api/newsletter/confirm?token=bad');

      const response = await GET(request);

      expect(response.headers.get('location')).toContain('https://secure.example.com');
    });

    it('should fallback to a static redirect if URL constructor fails', async () => {
      mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));

      const invalidRequest = {
        url: 'http://invalid-url:badport',
      } as Request;

      // This setup will cause `new URL(request.url)` to throw, testing the inner catch block.
      const response = await GET(invalidRequest);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('/newsletter/confirmed?status=invalid');
    });
  });
});
