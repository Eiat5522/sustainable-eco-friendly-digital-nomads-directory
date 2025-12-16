import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import type { UserRole } from '@/types/auth';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => {
  const fetchMock = jest.fn();

  return {
    __esModule: true,
    client: {
      fetch: fetchMock,
    },
    __mock: { fetchMock },
  };
});

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

import { RequestTimeoutError } from '@/lib/http/request';

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const clientMockModule = jest.requireMock('@/lib/sanity/client') as {
  client: { fetch: jest.Mock };
  __mock: { fetchMock: jest.Mock };
};
const mockLogger = jest.requireMock('@/lib/logger').structuredLogger as {
  error: jest.Mock;
};

type RouteModule = typeof import('../route');
let GET: RouteModule['GET'];

const mockAuth = authMockModule.auth;
const mockFetch = clientMockModule.__mock.fetchMock;

// Helper type for mock session
type MockSession = Session & {
  user: {
    role?: UserRole;
  };
};

// Helper type for mock request
interface MockRequest extends Partial<NextRequest> {
  url?: string;
  json?: () => Promise<unknown>;
}

beforeAll(async () => {
  ({ GET } = await import('../route'));
});

describe('/api/admin/listings/stats', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetch.mockReset();
    mockLogger.error.mockReset();
  });

  it('requires admin access', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as MockSession);

    const request = {
      url: 'https://example.com/api/admin/listings/stats',
    } as MockRequest as NextRequest;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns listing statistics', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as MockSession);

    // Mock the responses in order of the API calls
    mockFetch.mockResolvedValueOnce(100); // totalCount
    mockFetch.mockResolvedValueOnce(75); // publishedCount
    mockFetch.mockResolvedValueOnce(10); // unpublishedCount
    mockFetch.mockResolvedValueOnce(5); // pendingCount
    mockFetch.mockResolvedValueOnce(10); // draftCount
    mockFetch.mockResolvedValueOnce(8); // featuredCount
    mockFetch.mockResolvedValueOnce([
      // typesCounts
      { type: 'cafe', count: 40 },
      { type: 'coworking', count: 30 },
      { type: 'accommodation', count: 30 },
    ]);

    const request = {
      url: 'https://example.com/api/admin/listings/stats',
    } as MockRequest as NextRequest;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      totalListings: 100,
      publishedListings: 75,
      unpublishedListings: 10,
      pendingListings: 5,
      draftListings: 10,
      featuredListings: 8,
      listingsByType: {
        cafe: 40,
        coworking: 30,
        accommodation: 30,
      },
    });
  });

  it('handles errors gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as MockSession);
    mockFetch.mockRejectedValue(new Error('Database error'));

    const request = {
      url: 'https://example.com/api/admin/listings/stats',
    } as MockRequest as NextRequest;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch listing statistics');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Admin listings stats GET error',
      expect.any(Error),
      {
        method: 'GET',
        route: '/api/admin/listings/stats',
        errorType: 'Error',
      }
    );
  });

  it('returns 504 when listing analytics time out', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as MockSession);
    mockFetch.mockRejectedValue(new RequestTimeoutError('Fetching listing statistics timed out'));

    const request = {
      url: 'https://example.com/api/admin/listings/stats',
    } as MockRequest as NextRequest;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(504);
    expect(json.error).toBe('Listing statistics request timed out');
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Admin listings stats GET error',
      expect.any(RequestTimeoutError),
      {
        method: 'GET',
        route: '/api/admin/listings/stats',
        errorType: 'RequestTimeoutError',
      }
    );
  });
});
