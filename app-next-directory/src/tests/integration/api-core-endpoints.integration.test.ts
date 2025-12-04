import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ApiResponseHandler } from '@/utils/api-response';
import * as citiesRoute from '../../../app/api/cities/route';
import { createListingsHandlers } from '../../../app/api/listings/route';
import { POST as performancePost } from '../../../app/api/performance/web-vitals/route';
import * as reviewsAnalyticsRoute from '../../../app/api/reviews/analytics/route';
import * as searchRoute from '../../../app/api/search/route';
import * as searchSuggestionsRoute from '../../../app/api/search/suggestions/route';
import { POST as sessionPost } from '../../../app/api/session/route';

jest.mock('@/lib/performance/alert-service', () => ({
  processMetricForAlert: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/db-helpers', () => {
  return {
    __esModule: true,
    getCollection: jest.fn(async () => mockedReviewCollection),
  };
});

const parseJson = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

// --- Mocks used by the reviews analytics route ---
type AggregateResult = { toArray: () => Promise<unknown[]> };

let mockedReviewCollection: {
  aggregate: jest.MockedFunction<(pipeline: unknown[]) => AggregateResult>;
};

beforeEach(() => {
  const aggregateBatches = [
    [
      {
        _id: null,
        totalReviews: 3,
        avgRating: 4.3,
        minRating: 3,
        maxRating: 5,
        uniqueListings: ['a', 'b'],
      },
    ],
    [
      { _id: 5, count: 2 },
      { _id: 4, count: 1 },
    ],
    [
      { _id: '2024-01', count: 2, avgRating: 4.5 },
      { _id: '2024-02', count: 1, avgRating: 4.0 },
    ],
    [
      { _id: 'eco-hub', avgRating: 4.6, reviewCount: 2 },
      { _id: 'green-stay', avgRating: 4.1, reviewCount: 1 },
    ],
    [
      { _id: 'approved', count: 3 },
      { _id: 'flagged', count: 0 },
    ],
    [
      { _id: 'positive', count: 2, avgRating: 4.5 },
      { _id: 'neutral', count: 1, avgRating: 4.0 },
    ],
    [
      {
        _id: null,
        avgResponseTime: 1800,
        minResponseTime: 1200,
        maxResponseTime: 2400,
        totalModerated: 3,
      },
    ],
  ];

  let aggregateCall = 0;
  const aggregate = jest.fn<(pipeline: unknown[]) => AggregateResult>(() => {
    const nextBatch = aggregateBatches[aggregateCall++] ?? [];
    return {
      async toArray() {
        return nextBatch;
      },
    };
  });

  mockedReviewCollection = {
    aggregate,
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('API integration (Jest)', () => {
  it('GET /api/listings returns paginated results with overrides', async () => {
    const fakeListings = [
      { title: 'Forest Cabin', slug: 'forest-cabin' },
      { title: 'Ocean Hub', slug: 'ocean-hub' },
    ];

    const collection = {
      find: jest.fn(() => ({
        skip: () => ({
          limit: () => ({
            toArray: async () => fakeListings,
          }),
        }),
      })),
      countDocuments: jest.fn(async () => fakeListings.length),
      findOne: jest.fn(async () => null),
      insertOne: jest.fn(async doc => ({ insertedId: doc.slug })),
    };

    const requireAuth = jest.fn().mockResolvedValue({ user: { id: 'user-1', plan: 'premium' } });
    const handleAuthError = jest
      .fn()
      .mockImplementation(error => ApiResponseHandler.error('auth failed', 401, String(error)));
    const getCollection = jest.fn(async () => collection);

    const handlers = createListingsHandlers({ requireAuth, handleAuthError, getCollection });

    const response = await handlers.GET({
      url: 'http://localhost/api/listings?page=1&limit=2',
    });
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        listings: fakeListings,
        pagination: {
          page: 1,
          limit: 2,
          total: 2,
          totalPages: 1,
        },
      },
    });
  });

  it('GET /api/listings rejects invalid pagination', async () => {
    const handlers = createListingsHandlers({
      requireAuth: jest.fn().mockResolvedValue({ user: { id: 'user-1', plan: 'premium' } }),
      handleAuthError: jest.fn().mockImplementation(() => ApiResponseHandler.error('auth', 401)),
      getCollection: jest.fn().mockResolvedValue({
        find: jest.fn(() => ({
          skip: jest.fn(() => ({
            limit: jest.fn(() => ({
              toArray: async () => [],
            })),
          })),
        })),
        countDocuments: jest.fn(async () => 0),
      }),
    });

    const response = await handlers.GET({
      url: 'http://localhost/api/listings?page=0&limit=0',
    });
    const { status } = await parseJson(response);

    expect(status).toBe(400);
  });

  it('GET /api/search uses test overrides to return stubbed results', async () => {
    const routeModule = searchRoute as unknown as {
      GET: (request: Request) => Promise<Response>;
      _testControl?: Record<string, any>;
    };

    if (routeModule._testControl) {
      routeModule._testControl.isE2ERunOverride = () => true;
      routeModule._testControl.buildE2ESearchResponseOverride = () => ({
        results: [{ slug: 'eco-hub', title: 'Eco Hub' }],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
      });
    }

    const response = await routeModule.GET(new Request('http://localhost/api/search?q=eco'));
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.results[0]).toEqual(expect.objectContaining({ slug: 'eco-hub' }));
  });

  it('GET /api/search/suggestions returns stubbed suggestions', async () => {
    const routeModule = searchSuggestionsRoute as unknown as {
      GET: (request: Request) => Promise<Response>;
      _testControl?: Record<string, any>;
    };

    if (routeModule._testControl) {
      routeModule._testControl.getSearchSuggestionsOverride = jest
        .fn()
        .mockResolvedValue(['bali', 'barcelona']);
    }

    const response = await routeModule.GET(
      new Request('http://localhost/api/search/suggestions?q=b')
    );
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: { suggestions: ['bali', 'barcelona'] },
    });
  });

  it('GET /api/cities returns fixture data via override', async () => {
    const routeModule = citiesRoute as unknown as {
      GET: (request: Request) => Promise<Response>;
      _testControl?: Record<string, any>;
    };

    if (routeModule._testControl) {
      routeModule._testControl.fetchCitiesOverride = jest.fn().mockResolvedValue([
        { name: 'Lisbon', country: 'Portugal' },
        { name: 'Bali', country: 'Indonesia' },
      ]);
    }

    const response = await routeModule.GET(new Request('http://localhost/api/cities'));
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body).toEqual({
      cities: [
        { name: 'Lisbon', country: 'Portugal' },
        { name: 'Bali', country: 'Indonesia' },
      ],
    });
  });

  it('GET /api/reviews/analytics aggregates stats using mocked collection', async () => {
    const { GET } = reviewsAnalyticsRoute;

    const response = await GET(new Request('http://localhost/api/reviews/analytics'));
    const { status, body } = await parseJson(response);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data.overall.totalReviews).toBe('number');
    expect(typeof body.data.overall.avgRating).toBe('number');
  });

  it('POST /api/session returns success payload', async () => {
    const { status, body } = await parseJson(await sessionPost());
    expect(status).toBe(200);
    expect(body).toEqual({ success: true, data: { success: true, ok: true } });
  });

  it('POST /api/performance/web-vitals stores metrics and returns 200', async () => {
    const metrics = { name: 'LCP', value: 1800, page: '/listings', id: 'metric-1' };
    const response = await performancePost(
      new Request('http://localhost/api/performance/web-vitals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(metrics),
      })
    );

    const { status, body } = await parseJson(response);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        name: 'LCP',
        page: '/listings',
        status: 'good',
      })
    );
  });
});
