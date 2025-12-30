import { describe, expect, it, jest } from '@jest/globals';
import { ApiResponseHandler } from '@/utils/api-response';
import { createListingsHandlers } from './route';

// Mock Sanity client
jest.mock('@/lib/sanity', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

type MockRequest = {
  url?: string;
  json?: () => Promise<unknown>;
};

describe('API /api/listings route handlers', () => {
  const buildHandlers = (
    overrides: {
      requireAuth?: jest.Mock;
      handleAuthError?: jest.Mock;
      getCollection?: jest.Mock;
    } = {}
  ) => {
    const requireAuth =
      overrides.requireAuth ??
      jest.fn().mockResolvedValue({ user: { id: 'user-1', plan: 'premium', role: 'venueOwner' } });
    const handleAuthError =
      overrides.handleAuthError ??
      jest.fn((error: unknown) => ApiResponseHandler.error('auth error', 401, String(error ?? '')));

    // Default mock for collections
    const defaultUsersCollection = {
      findOne: jest.fn().mockResolvedValue({
        _id: 'user-1',
        listingQuotaTier: 'pro',
      }),
    };
    const defaultListingsCollection = {
      countDocuments: jest.fn().mockResolvedValue(0),
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
    };

    const getCollection =
      overrides.getCollection ??
      jest.fn((name: string) => {
        if (name === 'users') return Promise.resolve(defaultUsersCollection);
        if (name === 'listings') return Promise.resolve(defaultListingsCollection);
        return Promise.resolve(null);
      });

    return {
      handlers: createListingsHandlers({
        requireAuth,
        handleAuthError,
        getCollection,
      }),
      requireAuth,
      handleAuthError,
      getCollection,
      defaultUsersCollection,
      defaultListingsCollection,
    };
  };

  const parseResponse = async (response: Response) => ({
    status: response.status,
    body: await response.json(),
  });

  describe('GET', () => {
    it('returns paginated listings when authentication succeeds', async () => {
      const listings = [
        { id: 'l1', title: 'Listing 1' },
        { id: 'l2', title: 'Listing 2' },
      ];
      const cursor = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(listings),
      };
      const countDocuments = jest.fn().mockResolvedValue(25);
      const getCollection = jest.fn().mockResolvedValue({
        find: jest.fn().mockReturnValue(cursor),
        countDocuments,
      });
      const { handlers } = buildHandlers({ getCollection });

      const response = await handlers.GET({ url: 'http://localhost/api/listings?page=2&limit=5' });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          listings,
          pagination: {
            page: 2,
            limit: 5,
            total: 25,
            totalPages: 5,
          },
        },
      });
      expect(cursor.skip).toHaveBeenCalledWith(5);
      expect(cursor.limit).toHaveBeenCalledWith(5);
      expect(countDocuments).toHaveBeenCalledWith({});
    });

    it('returns error when pagination parameters are invalid', async () => {
      const { handlers, getCollection } = buildHandlers();

      const response = await handlers.GET({ url: 'http://localhost/api/listings?page=0&limit=5' });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Invalid pagination parameters' });
      expect(getCollection).not.toHaveBeenCalled();
    });

    it('returns error when request does not include a valid URL', async () => {
      const { handlers } = buildHandlers();

      const response = await handlers.GET({} as MockRequest);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Invalid request' });
    });

    it('returns server error when listings collection is unavailable', async () => {
      const getCollection = jest.fn().mockResolvedValue({});
      const { handlers } = buildHandlers({ getCollection });

      const response = await handlers.GET({ url: 'http://localhost/api/listings' });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Listings collection not available' });
    });

    it('returns server error when fetching listings fails', async () => {
      const cursor = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockRejectedValue(new Error('database failure')),
      };
      const getCollection = jest
        .fn()
        .mockResolvedValue({ find: jest.fn().mockReturnValue(cursor) });
      const { handlers } = buildHandlers({ getCollection });

      const response = await handlers.GET({ url: 'http://localhost/api/listings' });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({
        success: false,
        error: 'Failed to fetch listings',
        details: 'database failure',
      });
    });

    it('delegates to handleAuthError when authentication fails', async () => {
      const requireAuth = jest.fn().mockRejectedValue(new Error('UNAUTHORIZED'));
      const expectedResponse = ApiResponseHandler.unauthorized();
      const handleAuthError = jest.fn().mockReturnValue(expectedResponse);
      const { handlers } = buildHandlers({ requireAuth, handleAuthError });

      const response = await handlers.GET({ url: 'http://localhost/api/listings' });

      expect(response).toBe(expectedResponse);
      expect(handleAuthError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('POST', () => {
    const validPayload = {
      title: 'Eco Hub',
      slug: 'eco-hub',
      category: 'coworking',
      description: 'A sustainable space for digital nomads',
      location: 'Bangkok',
      ecoTags: ['solar'],
      digitalNomadFeatures: ['fast-wifi'],
    };

    const createRequest = (body: unknown) =>
      new Request('http://localhost/api/listings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      });

    it('returns forbidden when the authenticated user is not premium', async () => {
      const requireAuth = jest
        .fn()
        .mockResolvedValue({ user: { id: 'user-1', plan: 'basic', role: 'venueOwner' } });
      const usersCollection = {
        findOne: jest.fn().mockResolvedValue({ _id: 'user-1', listingQuotaTier: 'free' }),
      };
      const listingsCollection = {
        countDocuments: jest.fn().mockResolvedValue(1), // Free limit is 1
        findOne: jest.fn().mockResolvedValue(null),
      };
      const getCollection = jest.fn((name: string) => {
        if (name === 'users') return Promise.resolve(usersCollection);
        if (name === 'listings') return Promise.resolve(listingsCollection);
        return Promise.resolve(null);
      });
      const { handlers } = buildHandlers({ requireAuth, getCollection });

      // Mock client.fetch for the quota check
      const { client } = require('@/lib/sanity');
      (client.fetch as jest.Mock).mockResolvedValue({
        _id: 'user-1',
        listingQuotaTier: 'free',
        maxLocations: 1,
      });

      const response = await handlers.POST(createRequest(validPayload));
      const { status, body } = await parseResponse(response);

      expect(status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/Owner has reached their listing limit/);
    });

    it('returns error when request body is missing', async () => {
      const { handlers } = buildHandlers();

      const response = await handlers.POST({} as MockRequest);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Request body is required' });
    });

    it('returns error when JSON parsing fails', async () => {
      const { handlers } = buildHandlers();
      const request: MockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      const response = await handlers.POST(request);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Invalid JSON payload' });
    });

    it('returns validation errors when payload is invalid', async () => {
      const { handlers } = buildHandlers();
      const invalidRequest = createRequest({
        title: 'No',
        slug: 'Invalid Slug',
        ecoTags: 'not-an-array',
      });

      const response = await handlers.POST(invalidRequest);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid listing data');
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThan(0);
    });

    it('returns conflict when a listing with the same slug already exists', async () => {
      const listingsCollection = {
        countDocuments: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue({ id: 'existing' }),
      };
      const usersCollection = {
        findOne: jest.fn().mockResolvedValue({ _id: 'user-1', listingQuotaTier: 'pro' }),
      };
      const getCollection = jest.fn((name: string) => {
        if (name === 'users') return Promise.resolve(usersCollection);
        if (name === 'listings') return Promise.resolve(listingsCollection);
        return Promise.resolve(null);
      });
      const { handlers } = buildHandlers({ getCollection });

      const response = await handlers.POST(createRequest(validPayload));
      const { status, body } = await parseResponse(response);

      expect(status).toBe(409);
      expect(body).toEqual({ success: false, error: 'Listing with this slug already exists' });
      expect(listingsCollection.findOne).toHaveBeenCalledWith({ slug: 'eco-hub' });
    });

    it('creates a listing successfully when payload is valid', async () => {
      const listingsCollection = {
        countDocuments: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'new-id' }),
      };
      const usersCollection = {
        findOne: jest.fn().mockResolvedValue({ _id: 'user-1', listingQuotaTier: 'pro' }),
      };
      const getCollection = jest.fn((name: string) => {
        if (name === 'users') return Promise.resolve(usersCollection);
        if (name === 'listings') return Promise.resolve(listingsCollection);
        return Promise.resolve(null);
      });
      const { handlers } = buildHandlers({ getCollection });

      const response = await handlers.POST(createRequest(validPayload));
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({
        success: true,
        data: {
          ...validPayload,
          id: 'new-id',
          ownerId: 'user-1',
        },
        message: 'Listing created successfully',
      });
      expect(listingsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validPayload,
          ownerId: 'user-1',
        })
      );
    });

    it('returns bad request when insertOne throws an invalid JSON error', async () => {
      const listingsCollection = {
        countDocuments: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      const usersCollection = {
        findOne: jest.fn().mockResolvedValue({ _id: 'user-1', listingQuotaTier: 'pro' }),
      };
      const getCollection = jest.fn((name: string) => {
        if (name === 'users') return Promise.resolve(usersCollection);
        if (name === 'listings') return Promise.resolve(listingsCollection);
        return Promise.resolve(null);
      });
      const { handlers } = buildHandlers({ getCollection });

      const response = await handlers.POST(createRequest(validPayload));
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ success: false, error: 'Invalid JSON payload' });
    });

    it('returns server error when insertion fails unexpectedly', async () => {
      const listingsCollection = {
        countDocuments: jest.fn().mockResolvedValue(0),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockRejectedValue(new Error('database failure')),
      };
      const usersCollection = {
        findOne: jest.fn().mockResolvedValue({ _id: 'user-1', listingQuotaTier: 'pro' }),
      };
      const getCollection = jest.fn((name: string) => {
        if (name === 'users') return Promise.resolve(usersCollection);
        if (name === 'listings') return Promise.resolve(listingsCollection);
        return Promise.resolve(null);
      });
      const { handlers } = buildHandlers({ getCollection });

      const response = await handlers.POST(createRequest(validPayload));
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ success: false, error: 'Failed to create listing' });
    });

    it('returns forbidden when quota is exceeded', async () => {
      const listingsCollection = {
        countDocuments: jest.fn().mockResolvedValue(5), // Pro limit is 5
        findOne: jest.fn().mockResolvedValue(null),
      };
      const usersCollection = {
        findOne: jest.fn().mockResolvedValue({ _id: 'user-1', listingQuotaTier: 'pro' }),
      };
      const getCollection = jest.fn((name: string) => {
        if (name === 'users') return Promise.resolve(usersCollection);
        if (name === 'listings') return Promise.resolve(listingsCollection);
        return Promise.resolve(null);
      });
      const { handlers } = buildHandlers({ getCollection });

      // Mock client.fetch for the quota check
      const { client } = require('@/lib/sanity');
      (client.fetch as jest.Mock).mockResolvedValue({
        _id: 'user-1',
        listingQuotaTier: 'pro',
        maxLocations: 5,
      });

      const response = await handlers.POST(createRequest(validPayload));
      const { status, body } = await parseResponse(response);

      expect(status).toBe(403);
      expect(body).toEqual({
        success: false,
        error: 'Owner has reached their listing limit (5/5).',
      });
    });

    it('delegates to handleAuthError when authentication throws', async () => {
      const requireAuth = jest.fn().mockRejectedValue(new Error('UNAUTHORIZED'));
      const expectedResponse = ApiResponseHandler.unauthorized();
      const handleAuthError = jest.fn().mockReturnValue(expectedResponse);
      const { handlers } = buildHandlers({ requireAuth, handleAuthError });

      const response = await handlers.POST(createRequest(validPayload));

      expect(response).toBe(expectedResponse);
      expect(handleAuthError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
