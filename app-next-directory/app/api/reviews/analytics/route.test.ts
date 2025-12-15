import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/utils/db-helpers', () => ({ __esModule: true, getCollection: jest.fn() }));
jest.mock('@/utils/api-response', () => ({
  __esModule: true,
  ApiResponseHandler: {
    error: jest.fn(
      (message: string, status: number) =>
        new Response(JSON.stringify({ error: message }), { status })
    ),
    success: jest.fn(
      (data: unknown, message?: string) =>
        new Response(JSON.stringify({ success: true, data, ...(message && { message }) }), {
          status: 200,
        })
    ),
  },
}));

const dbHelpersMock = jest.requireMock('@/utils/db-helpers') as { getCollection: jest.Mock };
const mockGetCollection = dbHelpersMock.getCollection;

let GET: typeof import('./route').GET;

describe('API /api/reviews/analytics', () => {
  beforeAll(async () => {
    ({ GET } = await import('./route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createMockCollection(
    overallStats: unknown[] = [],
    ratingDistribution: unknown[] = [],
    trends: unknown[] = [],
    topListings: unknown[] = [],
    moderation: unknown[] = [],
    sentiment: unknown[] = [],
    responseTime: unknown[] = []
  ) {
    let callCount = 0;
    const aggregate = jest.fn((pipeline: unknown[]) => {
      // Return aggregations in the order they're called in the route
      const results = [
        overallStats, // 0: overallStats
        ratingDistribution, // 1: ratingDistribution
        trends, // 2: trends
        topListings, // 3: topListings
        moderation, // 4: moderation
        sentiment, // 5: sentiment
        responseTime, // 6: responseTime
      ];

      const result = results[callCount] || [];
      callCount++;

      return { toArray: jest.fn().mockResolvedValue(result) };
    });

    return { aggregate };
  }

  it('returns analytics with default 30d timeRange', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 100,
          avgRating: 4.5,
          minRating: 1,
          maxRating: 5,
          uniqueListings: ['slug1', 'slug2'],
        },
      ],
      [
        { _id: 5, count: 50 },
        { _id: 4, count: 30 },
        { _id: 3, count: 15 },
        { _id: 2, count: 3 },
        { _id: 1, count: 2 },
      ],
      [
        { _id: '2024-01-01', count: 10, avgRating: 4.5 },
        { _id: '2024-01-02', count: 15, avgRating: 4.2 },
      ],
      [
        { _id: 'listing-1', avgRating: 4.8, reviewCount: 25 },
        { _id: 'listing-2', avgRating: 4.6, reviewCount: 20 },
      ],
      [
        { _id: 'approved', count: 90 },
        { _id: 'pending', count: 8 },
        { _id: 'rejected', count: 2 },
      ],
      [
        { _id: 'positive', count: 60, avgRating: 4.5 },
        { _id: 'neutral', count: 30, avgRating: 3.5 },
        { _id: 'negative', count: 10, avgRating: 2.0 },
      ],
      [
        {
          _id: null,
          avgResponseTime: 12.5,
          minResponseTime: 1.2,
          maxResponseTime: 48.3,
          totalModerated: 92,
        },
      ]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.timeRange).toBe('30d');
    expect(json.data.overall).toMatchObject({
      totalReviews: 100,
      avgRating: 4.5,
      minRating: 1,
      maxRating: 5,
      uniqueListingsCount: 2,
    });
    expect(json.data.distribution).toHaveLength(5);
    expect(json.data.distribution[4]).toMatchObject({
      rating: 5,
      count: 50,
      percentage: '50.0',
    });
    expect(json.data.trends).toHaveLength(2);
    expect(json.data.topListings).toHaveLength(2);
    expect(json.data.moderation).toMatchObject({
      approved: 90,
      pending: 8,
      rejected: 2,
      flagged: 0,
    });
    expect(json.data.sentiment).toHaveLength(3);
    expect(json.data.responseTime).toMatchObject({
      avgHours: 12.5,
      minHours: 1.2,
      maxHours: 48.3,
      totalModerated: 92,
    });
  });

  it('supports 7d timeRange parameter', async () => {
    const mockCollection = createMockCollection([
      {
        _id: null,
        totalReviews: 20,
        avgRating: 4.2,
        minRating: 2,
        maxRating: 5,
        uniqueListings: ['slug1'],
      },
    ]);

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics?timeRange=7d');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.timeRange).toBe('7d');
    expect(json.data.overall.totalReviews).toBe(20);
  });

  it('supports 90d timeRange parameter', async () => {
    const mockCollection = createMockCollection([
      {
        _id: null,
        totalReviews: 500,
        avgRating: 4.3,
        minRating: 1,
        maxRating: 5,
        uniqueListings: ['slug1', 'slug2', 'slug3'],
      },
    ]);

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics?timeRange=90d');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.timeRange).toBe('90d');
    expect(json.data.overall.totalReviews).toBe(500);
  });

  it('supports 1y timeRange parameter', async () => {
    const mockCollection = createMockCollection([
      {
        _id: null,
        totalReviews: 2000,
        avgRating: 4.4,
        minRating: 1,
        maxRating: 5,
        uniqueListings: ['slug1', 'slug2', 'slug3', 'slug4'],
      },
    ]);

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics?timeRange=1y');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.timeRange).toBe('1y');
    expect(json.data.overall.totalReviews).toBe(2000);
  });

  it('filters by specific listing when listing parameter provided', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 25,
          avgRating: 4.7,
          minRating: 3,
          maxRating: 5,
          uniqueListings: ['specific-listing'],
        },
      ],
      [
        { _id: 5, count: 15 },
        { _id: 4, count: 8 },
        { _id: 3, count: 2 },
      ]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics?listing=specific-listing');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.overall.totalReviews).toBe(25);
    // topListings should be undefined when filtering by specific listing
    expect(json.data.topListings).toBeUndefined();
  });

  it('returns empty analytics when no reviews found', async () => {
    const mockCollection = createMockCollection();

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.overall).toMatchObject({
      totalReviews: 0,
      avgRating: 0,
      minRating: 0,
      maxRating: 0,
      uniqueListingsCount: 0,
    });
    expect(json.data.distribution).toHaveLength(5);
    // All distribution counts should be 0
    json.data.distribution.forEach((bucket: { count: number; percentage: string }) => {
      expect(bucket.count).toBe(0);
      expect(bucket.percentage).toBe('0.0');
    });
  });

  it('calculates rating distribution percentages correctly', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 100,
          avgRating: 4.0,
          minRating: 1,
          maxRating: 5,
          uniqueListings: ['slug1'],
        },
      ],
      [
        { _id: 5, count: 40 },
        { _id: 4, count: 30 },
        { _id: 3, count: 20 },
        { _id: 2, count: 5 },
        { _id: 1, count: 5 },
      ]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.distribution[4].percentage).toBe('40.0');
    expect(json.data.distribution[3].percentage).toBe('30.0');
    expect(json.data.distribution[2].percentage).toBe('20.0');
    expect(json.data.distribution[1].percentage).toBe('5.0');
    expect(json.data.distribution[0].percentage).toBe('5.0');
  });

  it('calculates moderation approval rate correctly', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 100,
          avgRating: 4.5,
          minRating: 1,
          maxRating: 5,
          uniqueListings: ['slug1'],
        },
      ],
      [],
      [],
      [],
      [
        { _id: 'approved', count: 80 },
        { _id: 'rejected', count: 20 },
        { _id: 'pending', count: 10 },
      ]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.moderation).toMatchObject({
      approved: 80,
      rejected: 20,
      pending: 10,
      total: 110,
      approvalRate: '80.0',
    });
  });

  it('handles zero approved and rejected reviews in approval rate', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 10,
          avgRating: 4.5,
          minRating: 1,
          maxRating: 5,
          uniqueListings: ['slug1'],
        },
      ],
      [],
      [],
      [],
      [{ _id: 'pending', count: 10 }]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.moderation.approvalRate).toBe('0.0');
  });

  it('returns null responseTime when no moderated reviews exist', async () => {
    const mockCollection = createMockCollection([
      {
        _id: null,
        totalReviews: 100,
        avgRating: 4.5,
        minRating: 1,
        maxRating: 5,
        uniqueListings: ['slug1'],
      },
    ]);

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.responseTime).toBeNull();
  });

  it('formats trends data with proper date format', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 25,
          avgRating: 4.5,
          minRating: 1,
          maxRating: 5,
          uniqueListings: ['slug1'],
        },
      ],
      [],
      [
        { _id: '2024-01-15', count: 10, avgRating: 4.6 },
        { _id: '2024-01-16', count: 15, avgRating: 4.4 },
      ]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.trends).toHaveLength(2);
    expect(json.data.trends[0]).toMatchObject({
      date: '2024-01-15',
      count: 10,
      avgRating: 4.6,
    });
  });

  it('calculates sentiment percentages correctly', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 100,
          avgRating: 4.5,
          minRating: 1,
          maxRating: 5,
          uniqueListings: ['slug1'],
        },
      ],
      [],
      [],
      [],
      [],
      [
        { _id: 'very_positive', count: 40, avgRating: 5.0 },
        { _id: 'positive', count: 30, avgRating: 4.5 },
        { _id: 'neutral', count: 20, avgRating: 3.0 },
        { _id: 'negative', count: 8, avgRating: 2.0 },
        { _id: 'very_negative', count: 2, avgRating: 1.0 },
      ]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.sentiment).toHaveLength(5);
    expect(json.data.sentiment[0]).toMatchObject({
      sentiment: 'very_positive',
      count: 40,
      avgRating: 5.0,
      percentage: '40.0',
    });
  });

  it('filters top listings by minimum review count (3+)', async () => {
    const mockCollection = createMockCollection(
      [
        {
          _id: null,
          totalReviews: 100,
          avgRating: 4.5,
          minRating: 1,
          maxRating: 5,
          uniqueListings: ['slug1', 'slug2', 'slug3'],
        },
      ],
      [],
      [],
      [
        { _id: 'listing-1', avgRating: 4.8, reviewCount: 25 },
        { _id: 'listing-2', avgRating: 4.6, reviewCount: 10 },
        // listings with < 3 reviews should be filtered by the aggregation
      ]
    );

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.topListings).toHaveLength(2);
    expect(json.data.topListings[0].reviewCount).toBeGreaterThanOrEqual(3);
  });

  it('handles errors gracefully', async () => {
    mockGetCollection.mockRejectedValue(new Error('Database connection failed'));

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Failed to fetch review analytics');
  });

  it('rounds avgRating to 2 decimal places', async () => {
    const mockCollection = createMockCollection([
      {
        _id: null,
        totalReviews: 100,
        avgRating: 4.456789,
        minRating: 1,
        maxRating: 5,
        uniqueListings: ['slug1'],
      },
    ]);

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.overall.avgRating).toBe(4.46);
  });

  it('includes message in success response', async () => {
    const mockCollection = createMockCollection([
      {
        _id: null,
        totalReviews: 100,
        avgRating: 4.5,
        minRating: 1,
        maxRating: 5,
        uniqueListings: ['slug1'],
      },
    ]);

    mockGetCollection.mockResolvedValue(mockCollection);

    const req = new Request('http://localhost/api/reviews/analytics?timeRange=7d');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain('7d');
  });
});
