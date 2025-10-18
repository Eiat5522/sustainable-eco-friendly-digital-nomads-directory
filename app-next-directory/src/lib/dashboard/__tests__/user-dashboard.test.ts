import { jest } from '@jest/globals';

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

jest.mock('@/lib/metrics/listing-views', () => ({
  getMonthlyViewCounts: jest.fn(),
  getLifetimeViewCounts: jest.fn(),
}));

const { client } = jest.requireMock('@/lib/sanity/client') as {
  client: { fetch: jest.Mock };
};
const { getMonthlyViewCounts, getLifetimeViewCounts } = jest.requireMock('@/lib/metrics/listing-views') as {
  getMonthlyViewCounts: jest.Mock;
  getLifetimeViewCounts: jest.Mock;
};

const ensureSanityUserModule = jest.requireActual('@/lib/sanity/user');

type EnsureSanityUserMock = typeof ensureSanityUserModule.ensureSanityUser & {
  mockReset: () => void;
  mockClear: () => void;
  mockResolvedValueOnce: (value: unknown) => typeof ensureSanityUserModule.ensureSanityUser;
  mock: { calls: unknown[] };
};

const ensureSanityUser = ensureSanityUserModule.ensureSanityUser as unknown as EnsureSanityUserMock;

const fetchMock = client.fetch as jest.Mock;
const monthlyViewsMock = getMonthlyViewCounts as jest.Mock;
const lifetimeViewsMock = getLifetimeViewCounts as jest.Mock;

describe('getUserDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensureSanityUser.mockReset();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when the session user is missing or has no id', async () => {
    const { getUserDashboardData } = await import('../user-dashboard');

    await expect(getUserDashboardData(null)).resolves.toBeNull();
    await expect(getUserDashboardData({ id: undefined, role: 'user' })).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('builds the regular user dashboard with normalized favorites and reviews', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-15T00:00:00Z'));

    fetchMock
      .mockResolvedValueOnce([
        {
          _id: 'fav-1',
          createdAt: '2024-03-01T12:00:00Z',
          listing: {
            _id: 'listing-1',
            name: 'Eco Stay',
            slug: { current: 'eco-stay' },
            city: { name: 'Lisbon' },
          },
        },
        {
          _id: 'ignore-me',
          createdAt: '2024-02-01T00:00:00Z',
          listing: { _id: undefined },
        },
      ])
      .mockResolvedValueOnce([
        { rating: 5, createdAt: '2024-03-05T10:00:00Z' },
        { rating: undefined, createdAt: '2024-01-01T00:00:00Z' },
      ]);

    const { getUserDashboardData } = await import('../user-dashboard');

    const result = await getUserDashboardData(
      { id: 'user-1', role: 'user', name: '  Jane Doe  ', email: ' USER@example.com ' },
      { months: 0 },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ id: 'user-1', role: 'user', name: '  Jane Doe  ', email: ' USER@example.com ' }),
        data: expect.objectContaining({
          kind: 'user',
          favorites: [
            expect.objectContaining({
              id: 'fav-1',
              listing: expect.objectContaining({
                id: 'listing-1',
                name: 'Eco Stay',
                slug: 'eco-stay',
                city: 'Lisbon',
              }),
            }),
          ],
          metrics: expect.objectContaining({
            favoritesCount: 1,
            reviewsWritten: 1,
            avgRatingGiven: 5,
          }),
          monthly: [
            expect.objectContaining({
              month: '2024-03',
              label: 'Mar 2024',
              reviewCount: 1,
              avgRating: 5,
              favoritesCount: 1,
              monthlyViewCount: null,
            }),
          ],
        }),
      }),
    );
  });

  it('returns venue owner dashboard with notice when no listings exist', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-04-10T00:00:00Z'));
    fetchMock.mockResolvedValueOnce({ ownedListings: [] });

    const { getUserDashboardData } = await import('../user-dashboard');

    const result = await getUserDashboardData({ id: 'owner-1', role: 'venueOwner' });

    expect(result?.data).toEqual(
      expect.objectContaining({
        kind: 'venueOwner',
        listings: [],
        notices: ['No linked listings were found for this account.'],
      }),
    );
    expect(monthlyViewsMock).not.toHaveBeenCalled();
    expect(lifetimeViewsMock).not.toHaveBeenCalled();
  });

  it('aggregates venue owner listings, metrics, and notices', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-05-20T00:00:00Z'));

    fetchMock
      .mockResolvedValueOnce({
        ownedListings: [
          { _id: 'listing-1', name: 'Eco Hub', slug: { current: 'eco-hub' }, city: { name: 'Berlin' } },
          { _id: 'listing-2' },
          { _id: '', name: 'Ignore me' },
        ],
      })
      .mockResolvedValueOnce([
        { listingId: 'listing-1', rating: 4, createdAt: '2024-05-01T00:00:00Z' },
        { listingId: 'listing-1', rating: 5, createdAt: '2024-04-01T00:00:00Z' },
        { listingId: 'listing-2', rating: 3, createdAt: '2024-03-15T00:00:00Z' },
      ])
      .mockResolvedValueOnce([
        { listingId: 'listing-1', createdAt: '2024-05-02T00:00:00Z' },
        { listingId: 'listing-2', createdAt: '2024-03-20T00:00:00Z' },
      ])
      .mockResolvedValueOnce([
        { listingId: 'listing-2', viewCount: 25, lastUpdated: '2024-05-10T00:00:00Z' },
      ]);

    monthlyViewsMock.mockResolvedValue(
      new Map([
        ['listing-1', new Map([['2024-05', 10], ['2024-04', 5]])],
        ['listing-2', new Map([['2024-03', 3]])],
      ]),
    );
    lifetimeViewsMock.mockResolvedValue(new Map([['listing-1', 100]]));

    const { getUserDashboardData } = await import('../user-dashboard');

    const result = await getUserDashboardData({ id: 'owner-1', role: 'venueOwner', name: null, email: null });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(monthlyViewsMock).toHaveBeenCalledWith(['listing-1', 'listing-2'], ['2024-03', '2024-04', '2024-05']);
    expect(lifetimeViewsMock).toHaveBeenCalledWith(['listing-1', 'listing-2']);
    expect(result?.data.kind).toBe('venueOwner');
    expect(result?.data.listings).toHaveLength(2);
    expect(result?.data.listings[0]).toEqual(
      expect.objectContaining({
        listing: expect.objectContaining({ id: 'listing-1', name: 'Eco Hub', slug: 'eco-hub', city: 'Berlin' }),
        summary: expect.objectContaining({ avgRating: 4.5, reviewCount: 2, favoritesCount: 1, viewCount: 100 }),
      }),
    );
    expect(result?.data.listings[1]).toEqual(
      expect.objectContaining({
        listing: expect.objectContaining({ id: 'listing-2', name: 'Untitled listing', slug: null, city: null }),
        summary: expect.objectContaining({ viewCount: 25 }),
      }),
    );
    expect(result?.data.monthlyTotals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ month: '2024-03', reviewCount: 1, favoritesCount: 1, avgRating: 3, monthlyViewCount: 3 }),
        expect.objectContaining({ month: '2024-05', reviewCount: 1, favoritesCount: 1, avgRating: 4, monthlyViewCount: 10 }),
      ]),
    );
    expect(result?.data.notices).toEqual([]);
    expect(result?.data.totals).toEqual(
      expect.objectContaining({ avgRating: 4, reviewCount: 3, favoritesCount: 2, viewCount: 125 }),
    );
  });
});
