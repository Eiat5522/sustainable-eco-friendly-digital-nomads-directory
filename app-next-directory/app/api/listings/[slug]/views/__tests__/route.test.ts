/**
 * Test Suite for Listing Views API Route
 * Tests covering:
 * 1. POST /api/listings/[slug]/views - Record listing view
 * 2. Error handling for missing/invalid slug
 * 3. Custom viewedAt timestamp handling
 * 4. Response structure validation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock the recordListingView function
const mockRecordListingView = jest.fn();

jest.mock('@/lib/metrics/listing-views', () => ({
  __esModule: true,
  recordListingView: mockRecordListingView,
}));

let POST: typeof import('../route').POST;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

describe('Listing Views API - POST /api/listings/[slug]/views', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRecordListingView.mockResolvedValue(undefined);
    
    // Dynamically import the route handler
    const module = await import('../route');
    POST = module.POST;
  });

  describe('Successful Requests', () => {
    it('should record a listing view with slug', async () => {
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRecordListingView).toHaveBeenCalledTimes(1);
      expect(mockRecordListingView).toHaveBeenCalledWith(
        'eco-workspace',
        expect.any(Date)
      );
    });

    it('should use custom viewedAt timestamp when provided', async () => {
      const customTimestamp = new Date('2024-01-15T10:30:00Z');
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ viewedAt: customTimestamp.toISOString() }),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRecordListingView).toHaveBeenCalledWith(
        'eco-workspace',
        expect.any(Date)
      );
      
      // Check that the date passed is close to our custom timestamp
      const passedDate = mockRecordListingView.mock.calls[0][1] as Date;
      expect(passedDate.getTime()).toBe(customTimestamp.getTime());
    });

    it('should use current date when viewedAt is invalid', async () => {
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ viewedAt: 'invalid-date' }),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRecordListingView).toHaveBeenCalledWith(
        'eco-workspace',
        expect.any(Date)
      );
    });

    it('should handle slug with hyphens and numbers', async () => {
      const request = new Request('http://localhost/api/listings/eco-workspace-123/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace-123' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockRecordListingView).toHaveBeenCalledWith(
        'eco-workspace-123',
        expect.any(Date)
      );
    });

    it('should handle request without JSON body', async () => {
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when slug is missing', async () => {
      const request = new Request('http://localhost/api/listings//views', {
        method: 'POST',
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: '' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Listing slug is required');
      expect(mockRecordListingView).not.toHaveBeenCalled();
    });

    it('should return 400 when slug is not a string', async () => {
      const request = new Request('http://localhost/api/listings/invalid/views', {
        method: 'POST',
      }) as NextRequest;
      
      // @ts-expect-error - Testing invalid type
      const context: RouteContext = { params: Promise.resolve({ slug: 123 }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Listing slug is required');
      expect(mockRecordListingView).not.toHaveBeenCalled();
    });

    it('should return 500 when recordListingView fails', async () => {
      mockRecordListingView.mockRejectedValueOnce(new Error('Database error'));

      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to record view');
    });

    it('should log error when recording view fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockRecordListingView.mockRejectedValueOnce(new Error('Recording error'));

      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      await POST(request, context);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[listing-view] POST failed');
      consoleErrorSpy.mockRestore();
    });

    it('should handle JSON parse errors gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json {',
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Response Structure', () => {
    it('should return content-type application/json', async () => {
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include success flag in response', async () => {
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as NextRequest;
      
      const context: RouteContext = { params: Promise.resolve({ slug: 'eco-workspace' }) };

      const response = await POST(request, context);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
    });
  });

  describe('Async Params Handling', () => {
    it('should correctly await async params', async () => {
      const request = new Request('http://localhost/api/listings/eco-workspace/views', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }) as NextRequest;
      
      // Test with async params resolution
      const context: RouteContext = {
        params: new Promise((resolve) => {
          setTimeout(() => resolve({ slug: 'eco-workspace' }), 10);
        }),
      };

      const response = await POST(request, context);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockRecordListingView).toHaveBeenCalledWith(
        'eco-workspace',
        expect.any(Date)
      );
    });
  });
});
