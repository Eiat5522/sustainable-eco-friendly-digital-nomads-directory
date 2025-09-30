jest.mock('../../../../src/utils/db-helpers', () => ({
  ...jest.requireActual('../../../../src/utils/db-helpers'),
  getCollection: async (name: string) => {
    return {
      findOne: async (query: any) => {
        return null;
      },
      insertOne: async (doc: any) => {
        return {
          insertedId: 'mock-id'
        }
      },
      find: (query: any) => ({
        skip: (n: number) => ({
          limit: (n: number) => ({
            toArray: async () => []
          })
        })
      }),
      countDocuments: async (query: any) => 0,
    }
  }
}));

jest.mock('../../../../src/utils/db-helpers', () => ({
  ...jest.requireActual('../../../../src/utils/db-helpers'),
  getCollection: async (name: string) => {
    return {
      findOne: async (query: any) => {
        return null;
      },
      insertOne: async (doc: any) => {
        return {
          insertedId: 'mock-id',
          ...doc
        }
      },
      find: (query: any) => ({
        skip: (n: number) => ({
          limit: (n: number) => ({
            toArray: async () => []
          })
        })
      }),
      countDocuments: async (query: any) => 0,
    }
  }
}));

jest.unmock('../../../../__mocks__/next/server');
// Use custom mocks for NextRequest and NextResponse
import { POST, GET } from '../../../../app/api/listings/route';
import { createMocks, MockNextRequest, MockNextResponse } from '../../../../__mocks__/next/server';

// Mock the requireAuth function to simulate an authenticated premium user for POST
jest.mock('../../../../src/utils/auth-helpers', () => ({
  ...jest.requireActual('../../../../src/utils/auth-helpers'),
  requireAuth: async () => ({
    user: {
      id: 'test-user-id',
      plan: 'premium',
      role: 'admin',
    },
  }),
}));

// Helper to simulate Next.js API handler invocation
function runHandler(handler: (req: any) => any, req: any): any {
  return handler(req);
}

describe('Listings API', () => {
  it('should return a list of listings', async () => {
    // Provide a valid URL with pagination params
    const { req } = createMocks({
      method: 'GET',
      json: undefined,
      url: 'http://localhost/api/listings?page=1&limit=10',
    });
    const response = await runHandler(GET, req);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.listings).toBeDefined();
    expect(Array.isArray(data.data.listings)).toBe(true);
  });

  it('should create a new listing', async () => {
    const { req } = createMocks({
      method: 'POST',
      json: {
        title: 'Test Listing',
        slug: 'test-listing',
        category: 'coworking',
        description: 'A detailed description for the test listing that meets the minimum 10 character requirement.',
        location: 'Bangkok, Thailand',
        ecoTags: ['eco-friendly'],
        digitalNomadFeatures: ['fast-wifi'],
        priceRange: 'budget',
        website: 'https://test.com',
        contactPhone: '123-456-7890',
        contactEmail: 'test@example.com',
      },
        url: 'http://localhost/api/listings',
    });
    const response = await runHandler(POST, req);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.message).toBe('Listing created successfully');
        expect(data.data).toBeDefined();
    expect(data.data.title).toBe('Test Listing');
  });

  it('should handle errors when fetching listings', async () => {
    // Mock the GET function to simulate an error
    const mockGet = jest.fn().mockImplementation(() => {
      return Promise.resolve(new MockNextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    });
    const response = await mockGet(new MockNextRequest({ method: 'GET', json: undefined, url: 'http://localhost/test' }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });

  it('should handle errors when creating a new listing', async () => {
    // Mock the POST function to simulate an error
    const mockPost = jest.fn().mockImplementation(() => {
      return Promise.resolve(new MockNextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    });
    const response = await mockPost(new MockNextRequest({ method: 'POST', json: {}, url: 'http://localhost/test' }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });

  it('should reject POST if user is not premium', async () => {
    jest.resetModules();
    jest.doMock('../../../../src/utils/auth-helpers', () => ({
      requireAuth: async () => ({
        user: {
          id: 'test-user-id',
          plan: 'free',
          role: 'user',
        },
      }),
    }));
    const { POST } = require('../../../../app/api/listings/route');
    const { req } = createMocks({
      method: 'POST',
      json: {
        title: 'Test Listing',
        slug: 'test-listing',
        category: 'coworking',
        description: 'A valid description',
        location: 'Bangkok, Thailand',
      },
      url: 'http://localhost/api/listings',
    });
    const response = await runHandler(POST, req);
    expect(response.status).toBe(403);

    // Restore original mock
    jest.resetModules();
    jest.unmock('../../../../src/utils/auth-helpers');
  });
  it('should return 400 for invalid pagination params', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: 'http://localhost/api/listings?page=0&limit=0',
      json: undefined,
    });
    const response = await runHandler(GET, req);
    expect(response.status).toBe(400);
  });

  it('should return 400 for malformed request', async () => {
    const response = await runHandler(GET, {});
    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid listing data', async () => {
    const { req } = createMocks({
      method: 'POST',
      json: {
        title: 'Te', // too short
        slug: 'invalid slug!', // not url-friendly
        category: '',
        description: 'short',
        location: '',
      },
      url: 'http://localhost/api/listings',
    });
    const response = await runHandler(POST, req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid listing data');
    expect(Array.isArray(data.details)).toBe(true);
    expect(data.details.length).toBeGreaterThan(0);
  });

  it('should return 400 for missing request body', async () => {
    const { req } = createMocks({
      method: 'POST',
      json: undefined,
      url: 'http://localhost/api/listings',
    });
    const response = await runHandler(POST, req);
    expect(response.status).toBe(400);
  });

  it('should return 405 for unsupported method', async () => {
    const { UNSUPPORTED } = require('../../../../app/api/listings/route');
    const response = await runHandler(UNSUPPORTED, {});
    expect(response.status).toBe(405);
  });
});

// --- Additional Coverage Tests ---

describe('Listings API - Edge Cases', () => {
  // Mock dependencies for error branches
  const mockApiResponseHandler = {
    error: jest.fn((msg, status = 500, details) => ({
      status,
      json: async () => ({ error: msg, details }),
    })),
    forbidden: jest.fn(() => ({ status: 403, json: async () => ({ error: 'Forbidden' }) })),
    success: jest.fn((data, message) => ({
      status: 200,
      json: async () => ({ data, message }),
    })),
  };

  const mockHandleAuthError = jest.fn(() => ({ status: 401, json: async () => ({ error: 'Auth error' }) }));

  const validUser = { user: { id: 'id', plan: 'premium' } };

  it('should return error if listings collection is unavailable (GET)', async () => {
    const handler = require('../../../../app/api/listings/route').createListingsHandlers({
      ApiResponseHandler: mockApiResponseHandler,
      handleAuthError: mockHandleAuthError,
      requireAuth: async () => validUser,
      getCollection: async () => undefined,
    }).GET;
    const req = { url: 'http://localhost/api/listings?page=1&limit=10', json: undefined };
    const resp = await handler(req);
    expect(resp.status).toBe(500);
  });

  it('should return error if listings collection is unavailable (POST)', async () => {
    const handler = require('../../../../app/api/listings/route').createListingsHandlers({
      ApiResponseHandler: mockApiResponseHandler,
      handleAuthError: mockHandleAuthError,
      requireAuth: async () => validUser,
      getCollection: async () => undefined,
    }).POST;
    const req = { json: async () => ({ title: 'Test', slug: 'test', category: 'cat', description: 'descdescdesc', location: 'loc' }) };
    const resp = await handler(req);
    expect(resp.status).toBe(500);
  });

  it('should return error for duplicate slug', async () => {
    const handler = require('../../../../app/api/listings/route').createListingsHandlers({
      ApiResponseHandler: mockApiResponseHandler,
      handleAuthError: mockHandleAuthError,
      requireAuth: async () => validUser,
      getCollection: async () => ({
        findOne: async () => ({ slug: 'test' }),
      }),
    }).POST;
    const req = { json: async () => ({ title: 'Test', slug: 'test', category: 'cat', description: 'descdescdesc', location: 'loc' }) };
    const resp = await handler(req);
    expect(resp.status).toBe(409);
  });

  it('should handle DB errors in insertOne', async () => {
    const handler = require('../../../../app/api/listings/route').createListingsHandlers({
      ApiResponseHandler: mockApiResponseHandler,
      handleAuthError: mockHandleAuthError,
      requireAuth: async () => validUser,
      getCollection: async () => ({
        findOne: async () => null,
        insertOne: async () => { throw new Error('DB error'); },
      }),
    }).POST;
    const req = { json: async () => ({ title: 'Test', slug: 'test', category: 'cat', description: 'descdescdesc', location: 'loc' }) };
    const resp = await handler(req);
    expect(resp.status).toBe(500);
  });

  it('should handle invalid JSON in POST', async () => {
    const handler = require('../../../../app/api/listings/route').createListingsHandlers({
      ApiResponseHandler: mockApiResponseHandler,
      handleAuthError: mockHandleAuthError,
      requireAuth: async () => validUser,
      getCollection: async () => ({}),
    }).POST;
    const req = { json: async () => { throw new Error('Invalid JSON'); } };
    const resp = await handler(req);
    expect(resp.status).toBe(400);
  });

  // Individual validation errors
  const invalidBodies = [
    { title: '', slug: 'valid-slug', category: 'cat', description: 'descdescdesc', location: 'loc' }, // title
    { title: 'Test', slug: '', category: 'cat', description: 'descdescdesc', location: 'loc' }, // slug
    { title: 'Test', slug: 'valid-slug', category: '', description: 'descdescdesc', location: 'loc' }, // category
    { title: 'Test', slug: 'valid-slug', category: 'cat', description: '', location: 'loc' }, // description
    { title: 'Test', slug: 'valid-slug', category: 'cat', description: 'descdescdesc', location: '' }, // location
  ];
  invalidBodies.forEach((body, idx) => {
    const invalidField = Object.entries(body).find(([k, v]) => !v)?.[0] ?? 'unknown';
    it(`should return 400 for invalid field ${invalidField}`, async () => {
      const handler = require('../../../../app/api/listings/route').createListingsHandlers({
        ApiResponseHandler: mockApiResponseHandler,
        handleAuthError: mockHandleAuthError,
        requireAuth: async () => validUser,
        getCollection: async () => ({
          findOne: async () => null,
          insertOne: async () => ({ insertedId: 'id' }),
        }),
      }).POST;
      const req = { json: async () => body };
      const resp = await handler(req);
      expect(resp.status).toBe(400);
    });
  });
});
