// Mock problematic ESM import before anything else
jest.mock('mongodb', () => {
  const mDb = { collection: jest.fn().mockReturnValue('mockCollection') };
  const mClient = { db: jest.fn().mockReturnValue(mDb) };
  return {
    MongoClient: Object.assign(jest.fn(() => mClient), {
      connect: jest.fn().mockResolvedValue(mClient)
    })
  };
});

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: {},
}));

import { createListingsHandlers } from '@/app/api/listings/route';
import { getCollection } from '@/utils/db-helpers';
import { requireAuth, handleAuthError } from '@/utils/auth-helpers';
import { ApiResponseHandler } from '@/utils/api-response';

/**
 * Mock MockNextRequest for testing since it's not exported from 'next/server'.
 */
class MockNextRequest {
  url: string;
  method: string;
  body: any;
  searchParams: URLSearchParams;
  constructor(url: string, init?: { method?: string; body?: any }) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.body = init?.body;
    this.searchParams = new URL(url).searchParams;
  }
  json() {
    // Ensure this.body is a string before parsing, otherwise return as is
    if (typeof this.body === 'string') {
      return Promise.resolve(JSON.parse(this.body));
    }
    return Promise.resolve(this.body ?? {});
  }
}

// Mock external dependencies
jest.mock('@/utils/db-helpers');
jest.mock('@/utils/auth-helpers');
jest.mock('@/utils/api-response');


// Move this mock into a beforeAll block to avoid hoisting issues
beforeAll(() => {
  jest.mock('next/server', () => ({
    MockNextRequest: MockNextRequest,
    NextResponse: {
      json: jest.fn((data, init) => ({
        status: init?.status || 200,
        json: () => Promise.resolve(data),
      })),
    },
  }));
});

// Type assertion for mocked functions
const getCollectionMock = getCollection as jest.Mock;
const requireAuthMock = requireAuth as jest.Mock;
const handleAuthErrorMock = handleAuthError as jest.Mock;
const ApiResponseHandlerMock = ApiResponseHandler as jest.Mocked<typeof ApiResponseHandler>;

describe('Listings API Route', () => {
  let GET: (req: any) => Promise<any>;
  let POST: (req: any) => Promise<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Explicitly mock ApiResponseHandler methods as Jest mock functions and return a value
    ApiResponseHandlerMock.success = jest.fn((data, message) => ({ success: true, data, message }));
    ApiResponseHandlerMock.error = jest.fn((error, status, details) => ({ success: false, error, status, ...(details && { details }) }));
    ApiResponseHandlerMock.forbidden = jest.fn(() => ({ success: false, error: 'Forbidden', status: 403 }));
    const handlers = createListingsHandlers({
      ApiResponseHandler: ApiResponseHandlerMock,
      handleAuthError: handleAuthErrorMock,
      requireAuth: requireAuthMock,
      getCollection: getCollectionMock,
    });
    GET = handlers.GET;
    POST = handlers.POST;
  });

  describe('GET', () => {
    it('should return listings with pagination', async () => {
      const mockListings = [
        { name: 'Listing 1', slug: 'listing-1' },
        { name: 'Listing 2', slug: 'listing-2' },
      ];
      const mockCount = 2;

      getCollectionMock.mockResolvedValue({
        find: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockListings),
        countDocuments: jest.fn().mockResolvedValue(mockCount),
      });

      const req = new MockNextRequest('http://localhost/api/listings?page=1&limit=10');
      await GET(req);

      expect(getCollectionMock).toHaveBeenCalledWith('listings');
      expect(ApiResponseHandlerMock.success).toHaveBeenCalledWith({
        listings: mockListings,
        pagination: {
          page: 1,
          limit: 10,
          total: mockCount,
          pages: 1,
        },
      });
    });

    it('should handle errors when fetching listings', async () => {
      getCollectionMock.mockRejectedValue(new Error('Database error'));

      const req = new MockNextRequest('http://localhost/api/listings');
      await GET(req);

      expect(getCollectionMock).toHaveBeenCalledWith('listings');
      expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith('Failed to fetch listings');
    });
  });

  describe('POST', () => {
    const mockListingData = {
      title: 'New Listing',
      description: 'A valid description',
      slug: 'new-listing',
      category: 'category',
      location: 'Bangkok',
    };

    it('should create a new listing for premium users', async () => {
      requireAuthMock.mockResolvedValue({
        user: { id: 'user123', plan: 'premium' },
      });
      getCollectionMock.mockResolvedValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'listing123' }),
        // Add no-op mocks for unused methods to avoid errors if called
        find: jest.fn(),
        skip: jest.fn(),
        limit: jest.fn(),
        toArray: jest.fn(),
        countDocuments: jest.fn(),
      });

      const req = new MockNextRequest('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify(mockListingData),
      });

      await POST(req);

      expect(requireAuthMock).toHaveBeenCalled();
      expect(getCollectionMock).toHaveBeenCalledWith('listings');
      expect(ApiResponseHandlerMock.success).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'listing123',
          ownerId: 'user123',
          status: 'active',
          ...mockListingData,
        }),
        'Listing created successfully'
      );
    });

    it('returns 400 for missing/invalid request body', async () => {
      requireAuthMock.mockResolvedValue({
        user: { id: 'user123', plan: 'premium' },
      });
      getCollectionMock.mockResolvedValue({
        findOne: jest.fn(),
        insertOne: jest.fn(),
        find: jest.fn(),
        skip: jest.fn(),
        limit: jest.fn(),
        toArray: jest.fn(),
        countDocuments: jest.fn(),
      });
      const req = {
        url: 'http://localhost/api/listings',
        method: 'POST',
        json: () => Promise.resolve(undefined),
      };
      const resp = await POST(req);
      expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith('Missing or invalid request body', 400);
    });

    it('returns 500 if listings collection unavailable', async () => {
      requireAuthMock.mockResolvedValue({
        user: { id: 'user123', plan: 'premium' },
      });
      getCollectionMock.mockResolvedValue({});
      const req = new MockNextRequest('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify(mockListingData),
      });
      const resp = await POST(req);
      expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith('Listings collection unavailable', 500);
    });

    it('returns 500 if insertOne throws', async () => {
      requireAuthMock.mockResolvedValue({
        user: { id: 'user123', plan: 'premium' },
      });
      getCollectionMock.mockResolvedValue({
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockRejectedValue(new Error('fail')),
        find: jest.fn(),
        skip: jest.fn(),
        limit: jest.fn(),
        toArray: jest.fn(),
        countDocuments: jest.fn(),
      });
      const req = new MockNextRequest('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify(mockListingData),
      });
      const resp = await POST(req);
      expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith('Failed to create listing', 500);
    });

    it('should return 403 if user is not premium', async () => {
      requireAuthMock.mockResolvedValue({
        user: { id: 'user123', plan: 'free' },
      });

      getCollectionMock.mockResolvedValue({
        findOne: jest.fn(),
        insertOne: jest.fn(),
        find: jest.fn(),
        skip: jest.fn(),
        limit: jest.fn(),
        toArray: jest.fn(),
        countDocuments: jest.fn(),
      });

      const req = new MockNextRequest('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify(mockListingData),
      });

      await POST(req);

      expect(requireAuthMock).toHaveBeenCalled();
      expect(ApiResponseHandlerMock.forbidden).toHaveBeenCalledWith();
    });

    it('should return 400 if listing data is invalid', async () => {
      requireAuthMock.mockResolvedValue({
        user: { id: 'user123', plan: 'premium' },
      });

      getCollectionMock.mockResolvedValue({
        findOne: jest.fn(),
        insertOne: jest.fn(),
        find: jest.fn(),
        skip: jest.fn(),
        limit: jest.fn(),
        toArray: jest.fn(),
        countDocuments: jest.fn(),
      });

      const req = new MockNextRequest('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify({ ...mockListingData, title: 'N' }), // Invalid title
      });

      await POST(req);

      expect(requireAuthMock).toHaveBeenCalled();
      expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith(
        'Invalid listing data',
        400,
        expect.any(Array)
      );
    });

    it('should return 409 if listing slug already exists', async () => {
      requireAuthMock.mockResolvedValue({
        user: { id: 'user123', plan: 'premium' },
      });
      getCollectionMock.mockResolvedValue({
        findOne: jest.fn().mockResolvedValue({ slug: 'new-listing' }),
        insertOne: jest.fn(),
        find: jest.fn(),
        skip: jest.fn(),
        limit: jest.fn(),
        toArray: jest.fn(),
        countDocuments: jest.fn(),
      });

      const req = new MockNextRequest('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify(mockListingData),
      });

      await POST(req);

      expect(requireAuthMock).toHaveBeenCalled();
      expect(getCollectionMock).toHaveBeenCalledWith('listings');
      expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith(
        'Listing with this slug already exists',
        409
      );
    });

    it('should handle auth errors when creating a listing', async () => {
        const authError = new Error('Authentication error');
        requireAuthMock.mockRejectedValue(authError);
        handleAuthErrorMock.mockReturnValue(ApiResponseHandler.error('Authentication failed', 401));

        getCollectionMock.mockResolvedValue({
          findOne: jest.fn(),
          insertOne: jest.fn(),
          find: jest.fn(),
          skip: jest.fn(),
          limit: jest.fn(),
          toArray: jest.fn(),
          countDocuments: jest.fn(),
        });

        const req = new MockNextRequest('http://localhost/api/listings', {
            method: 'POST',
            body: JSON.stringify(mockListingData),
        });

        await POST(req);

        expect(requireAuthMock).toHaveBeenCalled();
        expect(handleAuthErrorMock).toHaveBeenCalledWith(authError);
        expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith('Authentication failed', 401);
    });
  });
});
// Additional edge/branch coverage for route.ts

describe('Listings API Route - Edge Cases', () => {
  let GET: (req: any) => Promise<any>;
  let POST: (req: any) => Promise<any>;
  const ApiResponseHandlerMock = require('@/utils/api-response') as jest.Mocked<any>;
  const getCollectionMock = require('@/utils/db-helpers').getCollection as jest.Mock;
  const requireAuthMock = require('@/utils/auth-helpers').requireAuth as jest.Mock;
  const handleAuthErrorMock = require('@/utils/auth-helpers').handleAuthError as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    ApiResponseHandlerMock.success = jest.fn(() => null);
    ApiResponseHandlerMock.error = jest.fn(() => null);
    ApiResponseHandlerMock.forbidden = jest.fn(() => null);
    const handlers = require('@/app/api/listings/route').createListingsHandlers({
      ApiResponseHandler: ApiResponseHandlerMock,
      handleAuthError: handleAuthErrorMock,
      requireAuth: requireAuthMock,
      getCollection: getCollectionMock,
    });
    GET = handlers.GET;
    POST = handlers.POST;
  });

  it('GET falls back if ApiResponseHandler.success returns null', async () => {
    getCollectionMock.mockResolvedValue({
      find: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockResolvedValue(0),
    });
    // FIX: Use the local MockNextRequest class directly
    const req = new MockNextRequest('http://localhost/api/listings');
    const resp = await GET(req);
    expect(resp).toHaveProperty('listings');
    expect(resp).toHaveProperty('pagination');
  });

  it('GET falls back if ApiResponseHandler.error returns null', async () => {
    getCollectionMock.mockRejectedValue(new Error('fail'));
    // FIX: Use the local MockNextRequest class directly
    const req = new MockNextRequest('http://localhost/api/listings');
    const resp = await GET(req);
    expect(resp).toHaveProperty('error');
  });

  it('POST returns 400 on invalid JSON', async () => {
    requireAuthMock.mockResolvedValue({ user: { id: 'user123', plan: 'premium' } });
    const req = {
      url: 'http://localhost/api/listings',
      method: 'POST',
      json: () => { throw new Error('invalid json'); },
    };
    const resp = await POST(req);
    expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith('Invalid JSON', 400);
  });

  it('POST returns all validation errors', async () => {
    requireAuthMock.mockResolvedValue({ user: { id: 'user123', plan: 'premium' } });
    const req = {
      url: 'http://localhost/api/listings',
      method: 'POST',
      json: () => Promise.resolve({}),
    };
    const resp = await POST(req);
    expect(ApiResponseHandlerMock.error).toHaveBeenCalledWith(
      'Invalid listing data',
      400,
      expect.arrayContaining([
        expect.stringContaining('Title'),
        expect.stringContaining('Description'),
        expect.stringContaining('Slug'),
        expect.stringContaining('Category'),
        expect.stringContaining('Location'),
      ])
    );
  });
});