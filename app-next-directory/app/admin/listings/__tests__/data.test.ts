import { getAdminListings, getAdminListingStats } from '../data';

// Mock dependencies
jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn(async () => 'http://localhost:3000'),
}));

jest.mock('@/lib/server/cookies', () => ({
  getCookieHeader: jest.fn(async () => 'session=test-cookie'),
}));

const fetchMock = jest.fn();
const originalFetch = global.fetch;

describe('getAdminListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches listings with default parameters', async () => {
    const mockResponse = {
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        search: '',
        status: null,
        type: null,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await getAdminListings();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/listings?page=1&limit=20',
      expect.objectContaining({
        headers: { cookie: 'session=test-cookie' },
        signal: expect.any(AbortSignal),
      })
    );

    expect(result).toEqual(mockResponse);
  });

  it('fetches listings with custom page parameter', async () => {
    const mockResponse = {
      listings: [],
      pagination: {
        page: 2,
        limit: 20,
        totalCount: 30,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      },
      filters: {
        search: '',
        status: null,
        type: null,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await getAdminListings({ page: 2 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/listings?page=2&limit=20',
      expect.any(Object)
    );
  });

  it('includes search parameter in query string', async () => {
    const mockResponse = {
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        search: 'test',
        status: null,
        type: null,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await getAdminListings({ search: 'test' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/listings?page=1&limit=20&search=test',
      expect.any(Object)
    );
  });

  it('includes status parameter in query string', async () => {
    const mockResponse = {
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        search: '',
        status: 'published',
        type: null,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await getAdminListings({ status: 'published' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/listings?page=1&limit=20&status=published',
      expect.any(Object)
    );
  });

  it('includes type parameter in query string', async () => {
    const mockResponse = {
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        search: '',
        status: null,
        type: 'coworking',
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await getAdminListings({ type: 'coworking' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/listings?page=1&limit=20&type=coworking',
      expect.any(Object)
    );
  });

  it('includes all parameters in query string', async () => {
    const mockResponse = {
      listings: [],
      pagination: {
        page: 3,
        limit: 20,
        totalCount: 50,
        totalPages: 3,
        hasNextPage: false,
        hasPrevPage: true,
      },
      filters: {
        search: 'cafe',
        status: 'published',
        type: 'cafe',
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await getAdminListings({ page: 3, search: 'cafe', status: 'published', type: 'cafe' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/listings?page=3&limit=20&search=cafe&status=published&type=cafe',
      expect.any(Object)
    );
  });

  it('throws error when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    await expect(getAdminListings()).rejects.toThrow('Unauthorized');
  });

  it('throws default error message when error response has no error field', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(getAdminListings()).rejects.toThrow('Failed to fetch listings');
  });

  it('throws error when JSON parsing fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    await expect(getAdminListings()).rejects.toThrow('Failed to fetch listings');
  });

  it('throws error when response payload is invalid', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'payload' }),
    } as Response);

    await expect(getAdminListings()).rejects.toThrow('Invalid admin listings response payload');
  });

  it('clears timeout after successful fetch', async () => {
    const mockResponse = {
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        search: '',
        status: null,
        type: null,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    await getAdminListings();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('clears timeout after failed fetch', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    await expect(getAdminListings()).rejects.toThrow();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('returns properly formatted listing data', async () => {
    const mockResponse = {
      listings: [
        {
          id: 'listing-1',
          name: 'Test Coworking',
          slug: 'test-coworking',
          type: 'coworking',
          status: 'published',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          city: 'Bangkok',
          moderationStatus: 'approved',
          isFeatured: true,
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {
        search: '',
        status: null,
        type: null,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await getAdminListings();

    expect(result.listings).toHaveLength(1);
    expect(result.listings[0]).toEqual({
      id: 'listing-1',
      name: 'Test Coworking',
      slug: 'test-coworking',
      type: 'coworking',
      status: 'published',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      city: 'Bangkok',
      moderationStatus: 'approved',
      isFeatured: true,
    });
  });
});

describe('getAdminListingStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches listing statistics', async () => {
    const mockStats = {
      totalListings: 100,
      publishedListings: 80,
      unpublishedListings: 15,
      pendingListings: 5,
      draftListings: 10,
      featuredListings: 20,
      listingsByType: {
        coworking: 40,
        cafe: 30,
        accommodation: 20,
        restaurant: 10,
      },
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const result = await getAdminListingStats();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/listings/stats',
      expect.objectContaining({
        headers: { cookie: 'session=test-cookie' },
        signal: expect.any(AbortSignal),
      })
    );

    expect(result).toEqual(mockStats);
  });

  it('throws error when response is not ok', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    await expect(getAdminListingStats()).rejects.toThrow('Unauthorized');
  });

  it('throws default error message when error response has no error field', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(getAdminListingStats()).rejects.toThrow('Failed to fetch listing statistics');
  });

  it('throws error when JSON parsing fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as Response);

    await expect(getAdminListingStats()).rejects.toThrow('Failed to fetch listing statistics');
  });

  it('throws error when response payload is invalid', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'payload' }),
    } as Response);

    await expect(getAdminListingStats()).rejects.toThrow('Invalid listing stats response payload');
  });

  it('throws timeout error when request times out', async () => {
    fetchMock.mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('Request timeout');
          error.name = 'AbortError';
          reject(error);
        }, 50);
      });
    });

    await expect(getAdminListingStats()).rejects.toThrow('Request timed out while fetching listing statistics');
  });

  it('re-throws non-timeout errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    await expect(getAdminListingStats()).rejects.toThrow('Network error');
  });

  it('clears timeout after successful fetch', async () => {
    const mockStats = {
      totalListings: 100,
      publishedListings: 80,
      unpublishedListings: 15,
      pendingListings: 5,
      draftListings: 10,
      featuredListings: 20,
      listingsByType: {},
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    } as Response);

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    await getAdminListingStats();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('clears timeout after failed fetch', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    await expect(getAdminListingStats()).rejects.toThrow();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
