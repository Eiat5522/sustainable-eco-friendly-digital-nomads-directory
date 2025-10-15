/**
 * Jest Test Suite for Exit Preview API Route
 * Tests covering:
 * 1. GET /api/exit-preview - Disable draft/preview mode and redirect
 * 2. Proper handling of referer header
 */

import { jest } from '@jest/globals';

// Mock Next.js functions
const mockDisable = jest.fn();
const mockGet = jest.fn();
const mockRedirect = jest.fn();

jest.mock('next/headers', () => ({
  draftMode: jest.fn(async () => ({ disable: mockDisable })),
  headers: jest.fn(async () => ({ get: mockGet })),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    mockRedirect(path);
    throw new Error(`NEXT_REDIRECT:${path}`); // Next.js redirect throws
  }),
}));

describe('Exit Preview API - GET /api/exit-preview', () => {
  let GET: any;

  beforeAll(async () => {
    // Import after mocks are set up
    const module = await import('./route');
    GET = module.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDisable.mockResolvedValue(undefined);
  });

  describe('Successful Requests', () => {
    it('should disable draft mode', async () => {
      mockGet.mockReturnValue('http://localhost:3000/blog/test-post');

      try {
        await GET();
      } catch (error) {
        // Redirect throws, which is expected
      }

      expect(mockDisable).toHaveBeenCalledTimes(1);
    });

    it('should redirect to referer path when referer header exists', async () => {
      mockGet.mockReturnValue('http://localhost:3000/blog/test-post');

      try {
        await GET();
        fail('Should have thrown redirect error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('NEXT_REDIRECT:/blog/test-post');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/blog/test-post');
    });

    it('should redirect to home when no referer header', async () => {
      mockGet.mockReturnValue(null);

      try {
        await GET();
        fail('Should have thrown redirect error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('NEXT_REDIRECT:/');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('should extract pathname from referer URL correctly', async () => {
      mockGet.mockReturnValue('http://example.com:3000/listings/eco-cafe?param=value');

      try {
        await GET();
      } catch (error) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/listings/eco-cafe');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/listings/eco-cafe');
    });

    it('should handle referer with query parameters', async () => {
      mockGet.mockReturnValue('http://localhost:3000/search?q=coworking&city=bangkok');

      try {
        await GET();
      } catch (error) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/search');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/search');
    });

    it('should handle referer with hash', async () => {
      mockGet.mockReturnValue('http://localhost:3000/blog/article#section-2');

      try {
        await GET();
      } catch (error) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/blog/article');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/blog/article');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty referer string', async () => {
      mockGet.mockReturnValue('');

      try {
        await GET();
      } catch (error) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('should handle root path referer', async () => {
      mockGet.mockReturnValue('http://localhost:3000/');

      try {
        await GET();
      } catch (error) {
        expect((error as Error).message).toContain('NEXT_REDIRECT:/');
      }

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });
  });
});
