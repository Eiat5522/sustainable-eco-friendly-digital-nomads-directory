import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { structuredLogger } from '@/lib/logger';
import { createDashboardHandler, normalizeMonthWindow } from './route-helpers';

type RouteHandler = ReturnType<typeof createDashboardHandler>;

const createRequest = (url: string) => new Request(url, { method: 'GET' });

const baseSession = {
  user: {
    id: 'user-123',
    role: 'user',
    name: 'Test User',
    email: 'test@example.com',
  },
};

describe('normalizeMonthWindow', () => {
  it('returns the default window when parameter is absent', () => {
    expect(normalizeMonthWindow(null)).toBe(3);
  });

  it('returns the default window when parameter is not a number', () => {
    expect(normalizeMonthWindow('not-a-number')).toBe(3);
  });

  it('clamps the window to the minimum value of 1', () => {
    expect(normalizeMonthWindow('0')).toBe(1);
    expect(normalizeMonthWindow('-5')).toBe(1);
  });

  it('allows values within the permitted range', () => {
    expect(normalizeMonthWindow('6')).toBe(6);
  });

  it('caps the window at the maximum allowed value', () => {
    expect(normalizeMonthWindow('99')).toBe(12);
  });
});

describe('/api/user/dashboard GET', () => {
  let authMock: jest.Mock;
  let fetchDashboardMock: jest.Mock;
  let loggerMock: { error: jest.Mock };
  let GET: RouteHandler;
  let consoleErrorSpy: jest.SpyInstance;
  let structuredLoggerSpy: jest.SpyInstance;

  beforeEach(() => {
    authMock = jest.fn().mockResolvedValue({ ...baseSession });
    fetchDashboardMock = jest.fn();
    loggerMock = { error: jest.fn() };
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    structuredLoggerSpy = jest.spyOn(structuredLogger, 'error').mockImplementation(() => undefined);

    GET = createDashboardHandler({
      authFn: authMock as any,
      fetchDashboard: fetchDashboardMock as any,
      logger: loggerMock,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    structuredLoggerSpy.mockRestore();
  });

  it('returns 401 when no authenticated user is present', async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await GET(createRequest('http://localhost/api/user/dashboard') as any);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(fetchDashboardMock).not.toHaveBeenCalled();
  });

  it('normalises invalid month input to the default window', async () => {
    const dashboardPayload = {
      user: baseSession.user,
      generatedAt: '2024-01-01T00:00:00.000Z',
      range: { months: 3, from: '2023-11-01T00:00:00.000Z', to: '2024-01-01T00:00:00.000Z' },
      data: {
        kind: 'user',
        favorites: [],
        metrics: { favoritesCount: 0, reviewsWritten: 0, avgRatingGiven: null },
        monthly: [],
      },
    };
    fetchDashboardMock.mockResolvedValueOnce(dashboardPayload);

    const response = await GET(
      createRequest('http://localhost/api/user/dashboard?months=not-a-number') as any,
    );

    expect(authMock).toHaveBeenCalledTimes(1);
    expect(fetchDashboardMock).toHaveBeenCalledWith(
      {
        id: 'user-123',
        role: 'user',
        name: 'Test User',
        email: 'test@example.com',
      },
      { months: 3 },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ dashboard: dashboardPayload });
  });

  it('caps requested months to the maximum window', async () => {
    fetchDashboardMock.mockResolvedValueOnce({ dashboard: true });

    const response = await GET(createRequest('http://localhost/api/user/dashboard?months=42') as any);

    expect(authMock).toHaveBeenCalledTimes(1);
    expect(fetchDashboardMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-123' }), {
      months: 12,
    });
    expect(response.status).toBe(200);
  });

  it('returns 404 when dashboard data is unavailable', async () => {
    fetchDashboardMock.mockResolvedValueOnce(null);

    const response = await GET(createRequest('http://localhost/api/user/dashboard') as any);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Dashboard unavailable' });
  });

  it('logs with structuredLogger and returns 500 on unexpected failure', async () => {
    const failure = new Error('dashboard failure');
    fetchDashboardMock.mockRejectedValueOnce(failure);

    const response = await GET(createRequest('http://localhost/api/user/dashboard?months=6') as any);

    expect(loggerMock.error).toHaveBeenCalledWith('[user-dashboard] GET failed', failure, {
      route: '/api/user/dashboard',
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Unable to load dashboard data' });
  });

  it('falls back to structuredLogger logging when no logger is provided', async () => {
    fetchDashboardMock.mockRejectedValueOnce(new Error('dashboard failure'));

    const handler = createDashboardHandler({
      authFn: authMock as any,
      fetchDashboard: fetchDashboardMock as any,
    });

    const response = await handler(createRequest('http://localhost/api/user/dashboard') as any);

    expect(structuredLoggerSpy).toHaveBeenCalledWith(
      '[user-dashboard] GET failed',
      expect.any(Error),
      { route: '/api/user/dashboard' }
    );
    expect(response.status).toBe(500);
  });
});
