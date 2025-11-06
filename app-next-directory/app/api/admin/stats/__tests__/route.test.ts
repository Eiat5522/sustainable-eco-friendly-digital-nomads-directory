import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  __esModule: true,
  fetchAdminAnalytics: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { fetchAdminAnalytics } from '@/lib/admin/analytics';

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const analyticsMockModule = jest.requireMock('@/lib/admin/analytics') as {
  fetchAdminAnalytics: jest.Mock;
};

type RouteModule = typeof import('../route');
let GET: RouteModule['GET'];
let POST: RouteModule['POST'];

const mockAuth = authMockModule.auth;
const mockFetchAnalytics = analyticsMockModule.fetchAdminAnalytics;
const mockLogger = jest.requireMock('@/lib/logger').structuredLogger as {
  error: jest.Mock;
};

beforeAll(async () => {
  ({ GET, POST } = await import('../route'));
});

describe('/api/admin/stats', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetchAnalytics.mockReset();
    mockLogger.error.mockReset();
  });

  it('requires admin access', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const response = await GET({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockFetchAnalytics).not.toHaveBeenCalled();
  });

  it('returns transformed analytics for admin users', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetchAnalytics.mockResolvedValue({
      overview: {
        totalUsers: 42,
        totalListings: 17,
        totalReviews: 9,
        weeklySignups: 5,
        pendingModeration: 3,
      },
      userRoles: { admin: 2, user: 38, moderator: 2 },
      generatedAt: '2024-03-01T12:00:00.000Z',
    });

    const response = await GET({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      totalUsers: 42,
      totalListings: 17,
      totalReviews: 9,
      weeklySignups: 5,
      pendingModeration: 3,
      userRoles: { admin: 2, user: 38, moderator: 2 },
      generatedAt: '2024-03-01T12:00:00.000Z',
    });
    expect(mockFetchAnalytics).toHaveBeenCalledTimes(1);
  });

  it('allows super administrators', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin' } } as any);
    mockFetchAnalytics.mockResolvedValue({
      overview: {
        totalUsers: 1,
        totalListings: 1,
        totalReviews: 1,
        weeklySignups: 0,
        pendingModeration: 0,
      },
      userRoles: { superAdmin: 1 },
      generatedAt: '2024-01-01T00:00:00.000Z',
    });

    const response = await GET({} as any, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(mockFetchAnalytics).toHaveBeenCalledTimes(1);
  });

  it('handles analytics fetch failures', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetchAnalytics.mockRejectedValue(new Error('analytics unavailable'));
    const response = await GET({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch admin stats');
    expect(mockFetchAnalytics).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('Admin stats error', expect.any(Error), {
      method: 'GET',
      route: '/api/admin/stats',
    });
  });

  it('rejects POST requests', async () => {
    const response = await POST({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(405);
    expect(json.error).toBe('Method not allowed');
    expect(mockAuth).not.toHaveBeenCalled();
  });
});
