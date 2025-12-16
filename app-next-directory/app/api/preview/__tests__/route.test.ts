/**
 * Test Suite for Preview Mode API Route
 * Tests covering:
 * 1. GET /api/preview - Enable preview/draft mode
 * 2. Token validation
 * 3. Redirect behavior
 * 4. Error handling
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock Next.js modules
const mockEnable = jest.fn();
const mockDraftMode = jest.fn(() => Promise.resolve({ enable: mockEnable }));
jest.mock('next/headers', () => ({
  __esModule: true,
  draftMode: mockDraftMode,
}));

const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  __esModule: true,
  redirect: mockRedirect,
}));

// Mock token validation
const mockValidatePreviewToken = jest.fn();
jest.mock('@/lib/sanity.utils', () => ({
  __esModule: true,
  validatePreviewToken: mockValidatePreviewToken,
}));

let GET: typeof import('../route').GET;

describe('Preview Mode API - GET /api/preview', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    // Dynamically import the route handler
    const routeModule = await import('../route');
    GET = routeModule.GET;
  });

  describe('Successful Preview Activation', () => {
    it('should enable preview mode with valid token and slug', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=test-listing&type=listing'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/listings/test-listing');
      }

      expect(mockValidatePreviewToken).toHaveBeenCalledWith('valid-secret');
      expect(mockDraftMode).toHaveBeenCalled();
      expect(mockEnable).toHaveBeenCalled();
    });

    it('should redirect to listings path for listing type', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=eco-workspace&type=listing'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/listings/eco-workspace');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/listings/eco-workspace');
    });

    it('should redirect to appropriate path for non-listing type', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=test-post&type=blog'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/blog/test-post');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/blog/test-post');
    });

    it('should handle preview without type parameter', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=test-slug'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('NEXT_REDIRECT');
      }

      expect(mockDraftMode).toHaveBeenCalled();
      expect(mockEnable).toHaveBeenCalled();
    });

    it('should handle slug with hyphens', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=eco-workspace-amsterdam&type=listing'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain(
          'NEXT_REDIRECT:/listings/eco-workspace-amsterdam'
        );
      }
    });
  });

  describe('Token Validation', () => {
    it('should return 401 when token is invalid', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(false);

      const request = new Request(
        'http://localhost/api/preview?secret=invalid-secret&slug=test-listing&type=listing'
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Invalid token');
      expect(mockDraftMode).not.toHaveBeenCalled();
      expect(mockEnable).not.toHaveBeenCalled();
    });

    it('should return 401 when token is missing', async () => {
      const request = new Request('http://localhost/api/preview?slug=test-listing&type=listing');

      const response = await GET(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe('Invalid token');
      expect(mockValidatePreviewToken).toHaveBeenCalledWith(null);
    });

    it('should return 401 for empty token', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(false);

      const request = new Request(
        'http://localhost/api/preview?secret=&slug=test-listing&type=listing'
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle token with special characters', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=abc-123_xyz.token&slug=test&type=listing'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('NEXT_REDIRECT');
      }

      expect(mockValidatePreviewToken).toHaveBeenCalledWith('abc-123_xyz.token');
    });
  });

  describe('Slug Validation', () => {
    it('should return 400 when slug is missing', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request('http://localhost/api/preview?secret=valid-secret&type=listing');

      const response = await GET(request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('No slug in the request');
      expect(mockDraftMode).not.toHaveBeenCalled();
    });

    it('should return 400 for empty slug', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=&type=listing'
      );

      const response = await GET(request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe('No slug in the request');
    });
  });

  describe('Path Construction', () => {
    it('should construct path with listing type', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=test-listing&type=listing'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('/listings/test-listing');
      }
    });

    it('should construct path with blog type', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=blog-post&type=blog'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('/blog/blog-post');
      }
    });

    it('should construct path with city type', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=amsterdam&type=city'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('/city/amsterdam');
      }
    });

    it('should handle undefined type', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request('http://localhost/api/preview?secret=valid-secret&slug=test');

      try {
        await GET(request);
      } catch (error: unknown) {
        // Type is null when not provided, resulting in /null/test path
        expect((error as Error).message).toContain('/null/test');
      }
    });
  });

  describe('Security', () => {
    it('should validate token before processing', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(false);

      const request = new Request(
        'http://localhost/api/preview?secret=bad-secret&slug=test-listing&type=listing'
      );

      await GET(request);

      expect(mockValidatePreviewToken).toHaveBeenCalledWith('bad-secret');
      expect(mockDraftMode).not.toHaveBeenCalled();
    });

    it('should not enable draft mode without valid token', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(false);

      const request = new Request(
        'http://localhost/api/preview?secret=invalid&slug=test&type=listing'
      );

      await GET(request);

      expect(mockEnable).not.toHaveBeenCalled();
    });

    it('should not redirect without valid token', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(false);

      const request = new Request(
        'http://localhost/api/preview?secret=invalid&slug=test&type=listing'
      );

      await GET(request);

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Query Parameters', () => {
    it('should handle URL-encoded slug', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=eco%20workspace&type=listing'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('/listings/eco workspace');
      }
    });

    it('should handle multiple query parameters', async () => {
      mockValidatePreviewToken.mockReturnValueOnce(true);

      const request = new Request(
        'http://localhost/api/preview?secret=valid-secret&slug=test&type=listing&extra=ignored'
      );

      try {
        await GET(request);
      } catch (error: unknown) {
        expect((error as Error).message).toContain('NEXT_REDIRECT');
      }

      expect(mockDraftMode).toHaveBeenCalled();
    });
  });
});
