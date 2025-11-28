import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { auth } from '@/lib/auth'; // Keep import for type inference
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard'; // Keep import for type inference
import { structuredLogger } from '@/lib/logger'; // Keep import for type inference
import { GET } from './route'; // Import GET directly

// Mock external dependencies
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/dashboard/user-dashboard', () => ({
  getUserDashboardData: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(), // Mock the error method of structuredLogger
  },
}));

const createRequest = (url: string) => new Request(url, { method: 'GET' });

const baseSession = {
  user: {
    id: 'user-456',
    role: 'user',
    name: 'Analytics User',
    email: 'analytics@example.com',
  },
};

describe('/api/user/analytics GET', () => {
  let authMock: jest.Mock;
  let fetchDashboardMock: jest.Mock;
  let structuredLoggerErrorMock: jest.Mock; // Renamed for clarity

  beforeEach(() => {
    jest.resetAllMocks(); // Reset all mocks for a clean state
    authMock = jest.mocked(auth); // Access the mocked auth function
    fetchDashboardMock = jest.mocked(getUserDashboardData); // Access the mocked getUserDashboardData function
    structuredLoggerErrorMock = jest.mocked(structuredLogger.error); // Access the mocked structuredLogger.error function

    authMock.mockResolvedValue({ ...baseSession });
    // No need for loggerMock as we're directly spying on structuredLogger.error
    // No need for consoleErrorSpy as structuredLogger handles internal logging
  });

  afterEach(() => {
    // jest.restoreAllMocks is handled by jest.resetAllMocks in beforeEach
  });

  it('returns 401 for unauthenticated requests', async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await GET(createRequest('http://localhost/api/user/analytics'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(fetchDashboardMock).not.toHaveBeenCalled();
  });

  it('normalizes the requested months before fetching analytics', async () => {
    const dashboardPayload = {
      user: { id: 'user-456', role: 'user' },
      generatedAt: '2024-01-01T00:00:00.000Z',
      range: { months: 6, from: '2023-08-01T00:00:00.000Z', to: '2024-01-01T00:00:00.000Z' },
      data: {
        kind: 'user',
        favorites: [],
        metrics: { favoritesCount: 2, reviewsWritten: 5, avgRatingGiven: 4.5 },
        monthly: [],
      },
    };
    fetchDashboardMock.mockResolvedValueOnce(dashboardPayload);

    const response = await GET(
      createRequest('http://localhost/api/user/analytics?months=18') as any
    );

    expect(authMock).toHaveBeenCalled();
    expect(fetchDashboardMock).toHaveBeenCalledWith(
      {
        id: 'user-456',
        role: 'user',
        name: 'Analytics User',
        email: 'analytics@example.com',
      },
      { months: 12 }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      analytics: {
        user: { id: 'user-456', role: 'user' },
        generatedAt: '2024-01-01T00:00:00.000Z',
        range: { months: 6, from: '2023-08-01T00:00:00.000Z', to: '2024-01-01T00:00:00.000Z' },
        data: {
          kind: 'user',
          summary: {
            avgRating: 4.5,
            reviewCount: 5,
            favoritesCount: 2,
          },
          monthly: [],
        },
      },
    });
  });

  it('falls back to default month window when the query is not numeric', async () => {
    const dashboardPayload = {
      user: { id: 'user-456', role: 'user' },
      generatedAt: '2024-03-01T00:00:00.000Z',
      range: { months: 3, from: '2023-12-01T00:00:00.000Z', to: '2024-03-01T00:00:00.000Z' },
      data: {
        kind: 'user',
        metrics: { favoritesCount: 0, reviewsWritten: 0, avgRatingGiven: 0 },
        monthly: [],
      },
    };

    fetchDashboardMock.mockResolvedValueOnce(dashboardPayload);

    await GET(createRequest('http://localhost/api/user/analytics?months=abc') as any);

    expect(fetchDashboardMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-456' }), {
      months: 3,
    });
  });

  it('clamps the month window to at least one month when zero or negative is provided', async () => {
    fetchDashboardMock.mockResolvedValueOnce({
      user: { id: 'user-456', role: 'user' },
      generatedAt: '2024-04-01T00:00:00.000Z',
      range: { months: 1, from: '2024-03-01T00:00:00.000Z', to: '2024-04-01T00:00:00.000Z' },
      data: {
        kind: 'user',
        metrics: { favoritesCount: 0, reviewsWritten: 0, avgRatingGiven: 0 },
        monthly: [],
      },
    });

    await GET(createRequest('http://localhost/api/user/analytics?months=0') as any);

    expect(fetchDashboardMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-456' }), {
      months: 1,
    });
  });

  it('returns 404 when analytics data is missing', async () => {
    fetchDashboardMock.mockResolvedValueOnce(null);

    const response = await GET(createRequest('http://localhost/api/user/analytics'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Analytics unavailable' });
  });

  it('maps venue owner dashboards into analytics summaries', async () => {
    authMock.mockResolvedValueOnce({
      user: { ...baseSession.user, role: 'venueOwner' },
    } as any);
    const dashboardPayload = {
      user: { id: 'owner-1', role: 'venueOwner' },
      generatedAt: '2024-02-01T00:00:00.000Z',
      range: { months: 3, from: '2023-11-01T00:00:00.000Z', to: '2024-02-01T00:00:00.000Z' },
      data: {
        kind: 'venueOwner',
        totals: {
          avgRating: 4.2,
          reviewCount: 12,
          favoritesCount: 30,
          viewCount: 1500,
        },
        monthlyTotals: [
          {
            month: '2023-12',
            label: 'Dec 2023',
            avgRating: 4.1,
            reviewCount: 4,
            favoritesCount: 8,
            monthlyViewCount: 400,
          },
        ],
      },
    };
    fetchDashboardMock.mockResolvedValueOnce(dashboardPayload);

    const response = await GET(createRequest('http://localhost/api/user/analytics'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analytics).toEqual({
      user: { id: 'owner-1', role: 'venueOwner' },
      generatedAt: '2024-02-01T00:00:00.000Z',
      range: dashboardPayload.range,
      data: {
        kind: 'venueOwner',
        summary: {
          avgRating: 4.2,
          reviewCount: 12,
          favoritesCount: 30,
          viewCount: 1500,
        },
        monthly: dashboardPayload.data.monthlyTotals,
      },
    });
  });

  it('logs and returns 500 when an unexpected error occurs', async () => {
    const failure = new Error('analytics failure');
    fetchDashboardMock.mockRejectedValueOnce(failure);

    const response = await GET(createRequest('http://localhost/api/user/analytics'));

    expect(structuredLoggerErrorMock).toHaveBeenCalledWith('[user-analytics] GET failed', failure, {
      route: '/api/user/analytics',
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Unable to load analytics data' });
  });

  it('uses default role and clears nullable fields when session omits optional properties', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'bare-user' } } as any);
    fetchDashboardMock.mockResolvedValueOnce({
      user: { id: 'bare-user', role: 'user' },
      generatedAt: '2024-05-01T00:00:00.000Z',
      range: { months: 3, from: '2024-02-01T00:00:00.000Z', to: '2024-05-01T00:00:00.000Z' },
      data: {
        kind: 'user',
        metrics: { favoritesCount: 1, reviewsWritten: 1, avgRatingGiven: 5 },
        monthly: [],
      },
    });

    await GET(createRequest('http://localhost/api/user/analytics'));

    expect(fetchDashboardMock).toHaveBeenCalledWith(
      {
        id: 'bare-user',
        role: 'user',
        name: null,
        email: null,
      },
      { months: 3 }
    );
  });
});
