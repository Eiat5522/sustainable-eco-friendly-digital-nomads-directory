/**
 * Test Suite for Mock Environment API Route
 * Tests covering:
 * 1. GET /api/mock-env - Mock environment variables for testing
 * 2. Header-based environment configuration
 * 3. Response structure validation
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

let GET: typeof import('../route').GET;

describe('Mock Environment API - GET /api/mock-env', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Dynamically import the route handler
    const routeModule = await import('../route');
    GET = routeModule.GET;
  });

  describe('Successful Requests', () => {
    it('should return current environment settings', async () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('NODE_ENV');
      expect(data.data).toHaveProperty('previewSecret');
      expect(data.data.previewSecret).toBe('***'); // Secret should be masked
    });

    it('should update NODE_ENV when provided in headers', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return 'production';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.NODE_ENV).toBe('production');
    });

    it('should update preview secret when provided in headers', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-preview-secret') return 'test-secret-123';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.previewSecret).toBe('***'); // Should still be masked
    });

    it('should update both NODE_ENV and preview secret', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return 'test';
            if (header === 'x-test-preview-secret') return 'secret-456';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.NODE_ENV).toBe('test');
      expect(data.data.previewSecret).toBe('***');
    });

    it('should handle development environment', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return 'development';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.NODE_ENV).toBe('development');
    });
  });

  describe('Input Validation', () => {
    it('should ignore invalid NODE_ENV values', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return 'invalid-env';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should use default NODE_ENV, not the invalid value
      expect(['development', 'production', 'test']).toContain(data.data.NODE_ENV);
    });

    it('should handle empty header values', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return '';
            if (header === 'x-test-preview-secret') return '';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Response Structure', () => {
    it('should return content-type application/json', async () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include success flag in response', async () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
    });

    it('should set no-cache headers', async () => {
      const request = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const response = await GET(request);

      expect(response.headers.get('cache-control')).toContain('no-store');
      expect(response.headers.get('cache-control')).toContain('no-cache');
      expect(response.headers.get('cache-control')).toContain('must-revalidate');
    });

    it('should never expose actual secret values', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-preview-secret') return 'super-secret-value';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.previewSecret).toBe('***');
      expect(data.data.previewSecret).not.toContain('super-secret-value');
    });
  });

  describe('Environment Transitions', () => {
    it('should handle transition from development to production', async () => {
      // First request with development
      const request1 = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return 'development';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(data1.data.NODE_ENV).toBe('development');

      // Second request with production
      const request2 = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return 'production';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(data2.data.NODE_ENV).toBe('production');
    });

    it('should handle test environment', async () => {
      const request = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-test-node-env') return 'test';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(data.data.NODE_ENV).toBe('test');
    });
  });
});
