jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

jest.mock('@/lib/sanity/user', () => ({
  ensureSanityUser: jest.fn(),
}));

jest.mock('@/lib/metrics/listing-views', () => ({
  getMonthlyViewCounts: jest.fn(),
  getLifetimeViewCounts: jest.fn(),
}));

import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';
import { getMonthlyViewCounts, getLifetimeViewCounts } from '@/lib/metrics/listing-views';
import type { VenueOwnerDashboardDTO } from '@/types/dto';

describe('getUserDashboardData - venue owner metrics', () => {
  const mockFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;
  const mockEnsureSanityUser = ensureSanityUser as jest.MockedFunction<typeof ensureSanityUser>;
  const mockGetMonthlyViews = getMonthlyViewCounts as jest.MockedFunction<typeof getMonthlyViewCounts>;
  const mockGetLifetimeViews = getLifetimeViewCounts as jest.MockedFunction<typeof getLifetimeViewCounts>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureSanityUser.mockResolvedValue(null);
  });

  it('merges lifetime and monthly view counts into the dashboard payload', async () => {
    const now = new Date('2024-07-22T12:00:00.000Z');
    jest.useFakeTimers({ now });

    mockFetch
      // Owned listings for venue owner
      .mockResolvedValueOnce({
        ownedListings: [
          {
            _id: 'listing-1',
            name: 'Eco Hub',
            slug: { current: 'eco-hub' },
            city: { name: 'Lisbon' },
          },
        ],
      })
      // Reviews
      .mockResolvedValueOnce([
        { listingId: 'listing-1', rating: 4, createdAt: now.toISOString() },
      ])
      // Favorites
      .mockResolvedValueOnce([
        { listingId: 'listing-1', createdAt: now.toISOString() },
      ])
      // Sanity analytics fallback
      .mockResolvedValueOnce([
        { listingId: 'listing-1', viewCount: 60, lastUpdated: now.toISOString() },
      ]);

    mockGetMonthlyViews.mockImplementation(async (_listingIds, monthKeys) => {
      const innerMap = new Map<string, number>();
      innerMap.set(monthKeys[0], 25);
      return new Map([[ 'listing-1', innerMap ]]);
    });

    mockGetLifetimeViews.mockResolvedValue(new Map([[ 'listing-1', 120 ]]));

    try {
      const result = await getUserDashboardData({ id: 'owner-1', role: 'venueOwner' }, { months: 1 });

      expect(result).not.toBeNull();
      expect(mockGetMonthlyViews).toHaveBeenCalledWith(['listing-1'], expect.arrayContaining(['2024-07']));
      expect(mockGetLifetimeViews).toHaveBeenCalledWith(['listing-1']);

      const data = result!.data as VenueOwnerDashboardDTO;
      expect(data.totals.viewCount).toBe(120);
      expect(data.monthlyTotals[0].viewCount).toBe(25);
      expect(data.listings[0].summary.viewCount).toBe(120);
      expect(data.listings[0].monthly[0].viewCount).toBe(25);
      expect(data.notices).toHaveLength(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
