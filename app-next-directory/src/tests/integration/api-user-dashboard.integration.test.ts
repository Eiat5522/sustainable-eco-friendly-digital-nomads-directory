import { describe, expect, it, jest } from '@jest/globals';

import { createDashboardHandler } from '../../../app/api/user/dashboard/route-helpers';
import { _createAnalyticsHandler } from '../../../app/api/user/analytics/route';

const parseJson = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

describe('User dashboard API (Jest integration)', () => {
  it('requires authentication for GET /api/user/dashboard', async () => {
    const handler = createDashboardHandler({
      authFn: jest.fn().mockResolvedValue(null),
      fetchDashboard: jest.fn(),
    });

    const response = await handler(new Request('http://localhost/api/user/dashboard'));
    const { status, body } = await parseJson(response);

    expect(status).toBe(401);
    expect(body).toEqual({ error: 'Authentication required' });
  });

  it('clamps the months window and returns dashboard payload when authenticated', async () => {
    const fetchDashboard = jest.fn().mockResolvedValue({
      data: {
        kind: 'user',
        metrics: { avgRatingGiven: 4.2, favoritesCount: 3, reviewsWritten: 5, viewCount: 10 },
        monthlyTotals: [],
        totals: { avgRating: 4.2, favoritesCount: 3, reviewCount: 5, viewCount: 10 },
      },
    });

    const handler = createDashboardHandler({
      authFn: jest.fn().mockResolvedValue({ user: { id: 'user-123', role: 'user' } }),
      fetchDashboard,
    });

    const response = await handler(
      new Request('http://localhost/api/user/dashboard?months=99', { method: 'GET' })
    );
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body.dashboard?.data).toBeDefined();
    expect(fetchDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-123' }),
      expect.objectContaining({ months: 12 }) // clamped to MAX_MONTH_WINDOW
    );
  });

  it('requires authentication for GET /api/user/analytics', async () => {
    const handler = _createAnalyticsHandler({
      authFn: jest.fn().mockResolvedValue(null),
      fetchDashboard: jest.fn(),
    });

    const response = await handler(new Request('http://localhost/api/user/analytics'));
    const { status, body } = await parseJson(response);

    expect(status).toBe(401);
    expect(body).toEqual({ error: 'Authentication required' });
  });

  it('returns analytics payload for authenticated users', async () => {
    const handler = _createAnalyticsHandler({
      authFn: jest.fn().mockResolvedValue({ user: { id: 'u-1', role: 'venueOwner' } }),
      fetchDashboard: jest.fn().mockResolvedValue({
        user: { id: 'u-1', role: 'venueOwner', name: null, email: null },
        generatedAt: '2024-01-01T00:00:00.000Z',
        range: { months: 2 },
        data: {
          kind: 'venueOwner',
          totals: { avgRating: 4.6, reviewCount: 12, favoritesCount: 8, viewCount: 120 },
          monthlyTotals: [],
        },
      }),
    });

    const response = await handler(new Request('http://localhost/api/user/analytics?months=2'));
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body.analytics.data.kind).toBe('venueOwner');
    expect(body.analytics.data.summary.reviewCount).toBe(12);
  });
});
