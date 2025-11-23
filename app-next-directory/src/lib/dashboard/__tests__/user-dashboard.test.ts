import { getUserDashboardData } from '../user-dashboard';

jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: jest.fn() },
}));

jest.mock('@/lib/sanity/user', () => ({
  ensureSanityUser: jest.fn(),
}));

jest.mock('@/lib/metrics/listing-views', () => ({
  getMonthlyViewCounts: jest.fn(),
  getLifetimeViewCounts: jest.fn(),
}));

const fetchMock = jest.requireMock('@/lib/sanity/client').client.fetch as jest.Mock;
const ensureSanityUserMock = jest.requireMock('@/lib/sanity/user').ensureSanityUser as jest.Mock;
const getMonthlyViewCountsMock = jest.requireMock('@/lib/metrics/listing-views')
  .getMonthlyViewCounts as jest.Mock;
const getLifetimeViewCountsMock = jest.requireMock('@/lib/metrics/listing-views')
  .getLifetimeViewCounts as jest.Mock;

describe('getUserDashboardData', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-15T00:00:00.000Z'));
    fetchMock.mockReset();
    ensureSanityUserMock.mockReset();
    getMonthlyViewCountsMock.mockReset();
    getLifetimeViewCountsMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when there is no session user id', async () => {
    const result = await getUserDashboardData(null);
    expect(result).toBeNull();
    expect(ensureSanityUserMock).not.toHaveBeenCalled();
  });

  it('builds a dashboard for regular users with favorites and reviews', async () => {
    ensureSanityUserMock.mockResolvedValueOnce(null);
    fetchMock.mockImplementation((query: string) => {
      if (query.includes('userFavorite')) {
        return Promise.resolve([
          {
            _id: 'fav-1',
            createdAt: '2024-01-10T00:00:00.000Z',
            listing: {
              _id: 'listing-1',
              name: 'Eco Hub',
              slug: 'eco-hub',
              city: 'Bangkok',
            },
          },
        ]);
      }
      if (query.includes('_type == "review"')) {
        return Promise.resolve([
          {
            rating: 4,
            createdAt: '2024-01-11T00:00:00.000Z',
          },
        ]);
      }
      return Promise.resolve(null);
    });

    const result = await getUserDashboardData({
      id: 'user-1',
      role: 'user',
      name: ' Alice ',
      email: 'Alice@Example.com ',
    });

    expect(ensureSanityUserMock).toHaveBeenCalledWith({
      id: 'user-1',
      name: ' Alice ',
      email: 'Alice@Example.com ',
      role: 'user',
    });
    expect(result?.data.kind).toBe('user');
    expect(result?.data.favorites).toHaveLength(1);
    expect(result?.data.metrics).toMatchObject({
      favoritesCount: 1,
      reviewsWritten: 1,
      avgRatingGiven: 4,
    });
  });

  it('builds venue owner analytics including notices and totals', async () => {
    ensureSanityUserMock.mockResolvedValue(null);
    fetchMock.mockImplementation((query: string) => {
      if (query.startsWith('*[_type == "user"')) {
        return Promise.resolve({
          ownedListings: [
            {
              _id: 'listing-1',
              name: 'Eco Stay',
              slug: { current: 'eco-stay' },
              city: { name: 'Bangkok' },
            },
          ],
        });
      }
      if (query.includes('_type == "review"')) {
        return Promise.resolve([
          {
            listingId: 'listing-1',
            rating: 5,
            createdAt: '2024-01-12T00:00:00.000Z',
          },
        ]);
      }
      if (query.includes('_type == "userFavorite"')) {
        return Promise.resolve([
          {
            listingId: 'listing-1',
            createdAt: '2024-01-13T00:00:00.000Z',
          },
        ]);
      }
      if (query.includes('_type == "listingAnalytics"')) {
        return Promise.resolve([
          {
            listingId: 'listing-1',
            viewCount: 20,
            lastUpdated: '2024-01-14T00:00:00.000Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });
    getMonthlyViewCountsMock.mockResolvedValue(new Map([['listing-1', new Map([['2023-12', 5]])]]));
    getLifetimeViewCountsMock.mockResolvedValue(new Map([['listing-1', 42]]));

    const result = await getUserDashboardData(
      {
        id: 'owner-1',
        role: 'venueOwner',
        name: 'Venue Owner',
        email: 'owner@example.com',
      },
      { months: 2 }
    );

    expect(result?.data.kind).toBe('venueOwner');
    const listings = (result?.data.kind === 'venueOwner' && result.data.listings) || [];
    expect(listings).toHaveLength(1);
    expect(listings[0].summary.viewCount).toBe(42);
    expect(result?.data.totals.viewCount).toBe(42);
    expect(result?.data.monthlyTotals[0].monthlyViewCount).toBe(5);
    expect(result?.data.notices).toHaveLength(0);
  });

  it('returns venue owner notice when no listings are present', async () => {
    ensureSanityUserMock.mockResolvedValue(null);
    fetchMock.mockImplementation((query: string) => {
      if (query.startsWith('*[_type == "user"')) {
        return Promise.resolve({ ownedListings: [] });
      }
      return Promise.resolve([]);
    });

    const result = await getUserDashboardData({
      id: 'owner-2',
      role: 'admin',
      name: 'Admin Owner',
      email: 'admin@example.com',
    });

    expect(result?.data.kind).toBe('venueOwner');
    expect(result?.data.listings).toHaveLength(0);
    expect(result?.data.notices).toEqual(['No linked listings were found for this account.']);
  });

  it('handles regular user with no favorites or reviews', async () => {
    ensureSanityUserMock.mockResolvedValueOnce(null);
    fetchMock.mockResolvedValue([]);

    const result = await getUserDashboardData({
      id: 'user-2',
      role: 'user',
      name: 'Bob',
      email: 'bob@example.com',
    });

    expect(result?.data.kind).toBe('user');
    expect(result?.data.favorites).toHaveLength(0);
    expect(result?.data.metrics).toMatchObject({
      favoritesCount: 0,
      reviewsWritten: 0,
      avgRatingGiven: null,
    });
  });

  it('handles venue owner with listings but no data', async () => {
    ensureSanityUserMock.mockResolvedValue(null);
    fetchMock.mockImplementation((query: string) => {
      if (query.startsWith('*[_type == "user"')) {
        return Promise.resolve({
          ownedListings: [
            {
              _id: 'listing-1',
              name: 'Eco Stay',
              slug: { current: 'eco-stay' },
              city: { name: 'Bangkok' },
            },
          ],
        });
      }
      return Promise.resolve([]);
    });

    getMonthlyViewCountsMock.mockResolvedValue(new Map());
    getLifetimeViewCountsMock.mockResolvedValue(new Map());

    const result = await getUserDashboardData({
      id: 'owner-3',
      role: 'venueOwner',
      name: 'Charlie',
      email: 'charlie@example.com',
    });

    expect(result?.data.kind).toBe('venueOwner');
    expect(result?.data.listings).toHaveLength(1);
    expect(result?.data.totals).toMatchObject({
      avgRating: null,
      reviewCount: 0,
      favoritesCount: 0,
      viewCount: null,
    });
  });

  it('handles null or undefined values in raw data', async () => {
    ensureSanityUserMock.mockResolvedValueOnce(null);
    fetchMock.mockImplementation((query: string) => {
      if (query.includes('userFavorite')) {
        return Promise.resolve([
          {
            _id: 'fav-1',
            createdAt: '2024-01-10T00:00:00.000Z',
            listing: null,
          },
        ]);
      }
      if (query.includes('_type == "review"')) {
        return Promise.resolve([
          {
            rating: null,
            createdAt: '2024-01-11T00:00:00.000Z',
          },
        ]);
      }
      return Promise.resolve(null);
    });

    const result = await getUserDashboardData({
      id: 'user-3',
      role: 'user',
      name: 'David',
      email: 'david@example.com',
    });

    expect(result?.data.kind).toBe('user');
    expect(result?.data.favorites).toHaveLength(0);
    expect(result?.data.metrics).toMatchObject({
      favoritesCount: 0,
      reviewsWritten: 0,
      avgRatingGiven: null,
    });
  });
});

describe('dashboard helpers', () => {
  describe('createMonthBuckets', () => {
    it('should create the correct number of buckets', () => {
      const { createMonthBuckets } = require('../user-dashboard');
      const buckets = createMonthBuckets(3, new Date('2024-01-15T00:00:00.000Z'));
      expect(buckets).toHaveLength(3);
    });
  });

  describe('normaliseAvg', () => {
    it('should return null when count is zero', () => {
      const { normaliseAvg } = require('../user-dashboard');
      expect(normaliseAvg(10, 0)).toBeNull();
    });

    it('should return the correct average', () => {
      const { normaliseAvg } = require('../user-dashboard');
      expect(normaliseAvg(10, 3)).toBe(3.33);
    });
  });

  describe('groupByListing', () => {
    it('should group documents by listingId', () => {
      const { groupByListing } = require('../user-dashboard');
      const docs = [
        { listingId: 'a', value: 1 },
        { listingId: 'b', value: 2 },
        { listingId: 'a', value: 3 },
      ];
      const grouped = groupByListing(docs);
      expect(grouped.get('a')).toEqual([
        { listingId: 'a', value: 1 },
        { listingId: 'a', value: 3 },
      ]);
      expect(grouped.get('b')).toEqual([{ listingId: 'b', value: 2 }]);
    });
  });
});
