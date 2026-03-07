import { fetchAdminAnalytics } from '@/lib/admin/analytics';
import { getAdminDashboardData } from '../data';

jest.mock('@/lib/admin/analytics', () => ({
  fetchAdminAnalytics: jest.fn(),
}));

describe('getAdminDashboardData', () => {
  const fetchAdminAnalyticsMock = jest.mocked(fetchAdminAnalytics);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns analytics from the server-side admin source', async () => {
    const analytics = {
      overview: {
        totalUsers: 12,
        totalListings: 7,
        totalReviews: 4,
        weeklySignups: 3,
        pendingModeration: 1,
      },
      range: {
        months: 6 as const,
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-03-01T00:00:00.000Z',
      },
      monthly: [
        {
          month: '2026-01',
          label: 'Jan 2026',
          usersCreated: 2,
          listingsCreated: 1,
          reviewsCreated: 1,
          pendingModeration: 0,
        },
      ],
      userRoles: {
        admin: 1,
        superAdmin: 1,
        user: 8,
        venueOwner: 2,
      },
      listingStatusBreakdown: {
        published: 5,
        unpublished: 1,
        pending: 1,
        draft: 0,
        featured: 2,
      },
      moderationQueue: [
        {
          id: 'mod-1',
          itemType: 'listing',
          itemName: 'Eco Hub',
          itemId: 'listing-1',
          reports: 2,
          lastActivity: '2026-03-01T00:00:00.000Z',
          status: 'pending',
        },
      ],
      generatedAt: '2026-03-01T00:00:00.000Z',
    };

    fetchAdminAnalyticsMock.mockResolvedValue(analytics);

    await expect(getAdminDashboardData(6)).resolves.toEqual(analytics);
    expect(fetchAdminAnalyticsMock).toHaveBeenCalledWith({ months: 6 });
  });

  it('normalizes unsupported month windows before fetching analytics', async () => {
    fetchAdminAnalyticsMock.mockResolvedValue({
      overview: {
        totalUsers: 0,
        totalListings: 0,
        totalReviews: 0,
        weeklySignups: 0,
        pendingModeration: 0,
      },
      range: {
        months: 3 as const,
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-03-01T00:00:00.000Z',
      },
      monthly: [],
      userRoles: {
        admin: 0,
        superAdmin: 0,
        user: 0,
        venueOwner: 0,
      },
      listingStatusBreakdown: {
        published: 0,
        unpublished: 0,
        pending: 0,
        draft: 0,
        featured: 0,
      },
      moderationQueue: [],
      generatedAt: '2026-03-01T00:00:00.000Z',
    });

    await getAdminDashboardData(9);

    expect(fetchAdminAnalyticsMock).toHaveBeenCalledWith({ months: 3 });
  });
});
