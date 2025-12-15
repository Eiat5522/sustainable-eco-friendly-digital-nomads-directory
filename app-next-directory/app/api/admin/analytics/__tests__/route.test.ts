import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import type { UserRole } from '@/types/auth';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  __esModule: true,
  fetchAdminAnalytics: jest.fn(),
}));

import { RequestTimeoutError } from '@/lib/http/request';

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const analyticsMockModule = jest.requireMock('@/lib/admin/analytics') as {
  fetchAdminAnalytics: jest.Mock;
};

let GET: typeof import('../route').GET;
let POST: typeof import('../route').POST;

const mockAuth = authMockModule.auth;
const mockFetchAnalytics = analyticsMockModule.fetchAdminAnalytics;

// Helper type for mock session
type MockSession = Session & {
  user: {
    role?: UserRole;
  };
};

beforeAll(async () => {
  ({ GET, POST } = await import('../route'));
});

describe('/api/admin/analytics', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetchAnalytics.mockReset();
  });

  it('requires admin role', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as MockSession);

    const response = await GET({} as NextRequest, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockFetchAnalytics).not.toHaveBeenCalled();
  });

  it('returns analytics for admin', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as MockSession);
    mockFetchAnalytics.mockResolvedValue({
      overview: {
        totalUsers: 100,
        totalListings: 40,
        totalReviews: 15,
        weeklySignups: 5,
        pendingModeration: 2,
      },
      userRoles: { admin: 2, user: 95 },
      moderationQueue: [],
      generatedAt: '2024-01-01T00:00:00.000Z',
    });

    const response = await GET({} as NextRequest, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.analytics).toBeDefined();
    expect(json.analytics.overview.totalUsers).toBe(100);
    expect(mockFetchAnalytics).toHaveBeenCalledTimes(1);
  });

  it('allows superAdmin role', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin' } } as MockSession);
    mockFetchAnalytics.mockResolvedValue({
      overview: {
        totalUsers: 1,
        totalListings: 1,
        totalReviews: 1,
        weeklySignups: 0,
        pendingModeration: 0,
      },
      userRoles: { superAdmin: 1 },
      moderationQueue: [],
      generatedAt: '2024-01-01T00:00:00.000Z',
    });

    const response = await GET({} as NextRequest, { params: Promise.resolve({}) });
    expect(response.status).toBe(200);
    expect(mockFetchAnalytics).toHaveBeenCalledTimes(1);
  });

  it('handles failures from analytics service', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as MockSession);
    mockFetchAnalytics.mockRejectedValue(new Error('Sanity down'));

    const response = await GET({} as NextRequest, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch admin analytics');
  });

  it('returns 504 when analytics fetching times out', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as MockSession);
    mockFetchAnalytics.mockRejectedValue(
      new RequestTimeoutError('Fetching admin analytics timed out')
    );

    const response = await GET({} as NextRequest, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(504);
    expect(json.error).toBe('Analytics request timed out');
  });

  it('returns 403 when the session has no role information', async () => {
    mockAuth.mockResolvedValue({ user: {} } as MockSession);

    const response = await GET({} as NextRequest, { params: Promise.resolve({}) });

    expect(response.status).toBe(403);
    expect(mockFetchAnalytics).not.toHaveBeenCalled();
  });

  it('returns 500 when authentication fails', async () => {
    mockAuth.mockRejectedValue(new Error('auth error'));

    const response = await GET({} as NextRequest, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch admin analytics');
  });

  it('returns 405 for POST requests (unsupported method)', async () => {
    // Note: No auth mocking needed since POST handler doesn't perform authentication

    const response = await POST({} as NextRequest, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(405);
    expect(json.error).toBe('Method not allowed');
  });
});
