/**
 * Test Suite for Revalidate API Route
 * Tests covering:
 * 1. GET /api/revalidate - Revalidate cache for specific paths
 * 2. Token authentication
 * 3. Path validation
 * 4. Error handling
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock Next.js revalidatePath
const mockRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({
  __esModule: true,
  revalidatePath: mockRevalidatePath,
}));

// Mock the logger
const mockStructuredLogger = {
  error: jest.fn(),
};
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: mockStructuredLogger,
}));

// Mock the revalidation token helper
const mockValidateRevalidationToken = jest.fn();
jest.mock('@/utils/revalidation-token', () => ({
  __esModule: true,
  validateRevalidationToken: mockValidateRevalidationToken,
}));

let GET: typeof import('../route').GET;

describe('Revalidate API - GET /api/revalidate', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, REVALIDATION_TOKEN: 'test-secret-token' };
    mockRevalidatePath.mockImplementation(() => {});

    // Dynamically import the route handler
    const routeModule = await import('../route');
    GET = routeModule.GET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Successful Revalidation', () => {
    it('should revalidate path with valid token', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/listings/eco-workspace',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/listings/eco-workspace';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.revalidated).toBe(true);
      expect(data.data.path).toBe('/listings/eco-workspace');
      expect(data.data).toHaveProperty('now');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/listings/eco-workspace');
      expect(mockValidateRevalidationToken).toHaveBeenCalledWith('test-secret-token');
    });

    it('should add leading slash if path does not have it', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=listings/eco-workspace',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return 'listings/eco-workspace';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.path).toBe('/listings/eco-workspace');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/listings/eco-workspace');
    });

    it('should revalidate homepage', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.path).toBe('/');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('should revalidate nested paths', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/cities/amsterdam/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/cities/amsterdam/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.path).toBe('/cities/amsterdam/listings');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/cities/amsterdam/listings');
    });

    it('should revalidate paths with hyphens', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/blog/sustainable-eco-travel',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/blog/sustainable-eco-travel';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const _data = await response.json();

      expect(response.status).toBe(200);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/blog/sustainable-eco-travel');
    });
  });

  describe('Token Validation', () => {
    it('should return 401 when token is invalid', async () => {
      mockValidateRevalidationToken.mockReturnValue(false);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=invalid-token&path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'invalid-token';
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid token');
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(mockValidateRevalidationToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should return 401 when token is missing', async () => {
      mockValidateRevalidationToken.mockReturnValue(false);

      const request = {
        url: 'http://localhost:3000/api/revalidate?path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(mockValidateRevalidationToken).toHaveBeenCalledWith(null);
    });

    it('should return 401 for empty token', async () => {
      mockValidateRevalidationToken.mockReturnValue(false);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=&path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return '';
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
      expect(mockValidateRevalidationToken).toHaveBeenCalledWith('');
    });

    it('should compare token case-sensitively', async () => {
      mockValidateRevalidationToken.mockReturnValue(false);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=TEST-SECRET-TOKEN&path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'TEST-SECRET-TOKEN'; // Wrong case
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid token');
      expect(mockValidateRevalidationToken).toHaveBeenCalledWith('TEST-SECRET-TOKEN');
    });
  });

  describe('Path Validation', () => {
    it('should return 400 when path is missing', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing path parameter');
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should return 400 for path with protocol', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=https://example.com/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return 'https://example.com/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid path parameter');
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should return 400 for path with directory traversal', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/listings/../admin',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/listings/../admin';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid path parameter');
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should return 400 for empty path', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing path parameter');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when revalidation fails', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);
      mockRevalidatePath.mockImplementationOnce(() => {
        throw new Error('Revalidation error');
      });

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error revalidating');
    });

    it('should log error when revalidation fails', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);
      mockStructuredLogger.error.mockClear();
      mockRevalidatePath.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/test',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/test';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      await GET(request);

      expect(mockStructuredLogger.error).toHaveBeenCalled();
      expect(mockStructuredLogger.error.mock.calls[0][0]).toContain('Error revalidating path');
    });
  });

  describe('Response Structure', () => {
    it('should return content-type application/json', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should include success flag and data', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('revalidated');
      expect(data.data).toHaveProperty('path');
      expect(data.data).toHaveProperty('now');
    });

    it('should include timestamp in response', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const beforeTime = Date.now();

      const request = {
        url: 'http://localhost:3000/api/revalidate?token=test-secret-token&path=/listings',
        nextUrl: {
          searchParams: {
            get: jest.fn((param: string) => {
              if (param === 'token') return 'test-secret-token';
              if (param === 'path') return '/listings';
              return null;
            }),
          },
        },
      } as unknown as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      const afterTime = Date.now();

      expect(data.data.now).toBeGreaterThanOrEqual(beforeTime);
      expect(data.data.now).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Multiple Revalidations', () => {
    it('should handle multiple revalidations in sequence', async () => {
      mockValidateRevalidationToken.mockReturnValue(true);

      const paths = ['/listings', '/blog', '/cities'];

      for (const path of paths) {
        const request = {
          url: `http://localhost:3000/api/revalidate?token=test-secret-token&path=${path}`,
          nextUrl: {
            searchParams: {
              get: jest.fn((param: string) => {
                if (param === 'token') return 'test-secret-token';
                if (param === 'path') return path;
                return null;
              }),
            },
          },
        } as unknown as NextRequest;

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.path).toBe(path);
      }

      expect(mockRevalidatePath).toHaveBeenCalledTimes(3);
    });
  });
});
