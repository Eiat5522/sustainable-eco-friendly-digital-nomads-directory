import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createAnalyticsHandler } from './route';

type RouteHandler = ReturnType<typeof createAnalyticsHandler>;

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
  let loggerMock: { error: jest.Mock };
  let GET: RouteHandler;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    authMock = jest.fn().mockResolvedValue({ ...baseSession });
    fetchDashboardMock = jest.fn();
    loggerMock = { error: jest.fn() };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    GET = createAnalyticsHandler({
      authFn: authMock as any,
      fetchDashboard: fetchDashboardMock as any,
      logger: loggerMock,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 401 for unauthenticated requests', async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await GET(createRequest('http://localhost/api/user/analytics') as any);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(fetchDashboardMock).not.toHaveBeenCalled();
  });

  it('normalises the requested months before fetching analytics', async () => {
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

    const response = await GET(createRequest('http://localhost/api/user/analytics?months=18') as any);

    expect(authMock).toHaveBeenCalled();
    expect(fetchDashboardMock).toHaveBeenCalledWith(
      {
        id: 'user-456',
        role: 'user',
        name: 'Analytics User',
        email: 'analytics@example.com',
      },
      { months: 12 },
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

  it('returns 404 when analytics data is missing', async () => {
    fetchDashboardMock.mockResolvedValueOnce(null);

    const response = await GET(createRequest('http://localhost/api/user/analytics') as any);

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

    const response = await GET(createRequest('http://localhost/api/user/analytics') as any);
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

    const response = await GET(createRequest('http://localhost/api/user/analytics') as any);

    expect(loggerMock.error).toHaveBeenCalledWith('[user-analytics] GET failed', failure, {
      route: '/api/user/analytics',
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Unable to load analytics data' });
  });

  it('falls back to console.error logging when no logger is provided', async () => {
    fetchDashboardMock.mockRejectedValueOnce(new Error('analytics failure'));

    const handler = createAnalyticsHandler({
      authFn: authMock as any,
      fetchDashboard: fetchDashboardMock as any,
    });

    const response = await handler(createRequest('http://localhost/api/user/analytics') as any);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[user-analytics] GET failed', expect.any(Error));
    expect(response.status).toBe(500);
  });
});
