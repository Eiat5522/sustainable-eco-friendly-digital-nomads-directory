jest.unmock('../../../../__mocks__/next/server');

// Mock API response handler
jest.mock('../../../../src/utils/api-response', () => ({
  ApiResponseHandler: {
    success: jest.fn((data, message) => ({
      json: () => Promise.resolve({ 
        success: true, 
        data, 
        message: message || 'Success' 
      }),
      status: 200,
    })),
    error: jest.fn((message, status = 500, errors) => ({
      json: () => Promise.resolve({ 
        error: message, 
        details: errors 
      }),
      status,
    })),
    forbidden: jest.fn(() => ({
      json: () => Promise.resolve({ error: 'Forbidden' }),
      status: 403,
    })),
  },
}));

// Mock auth helpers with different user scenarios
const mockAuthScenarios = {
  premium: {
    user: { id: 'test-user-id', plan: 'premium', role: 'admin' }
  },
  basic: {
    user: { id: 'basic-user-id', plan: 'basic', role: 'user' }
  },
  unauthenticated: null
};

let currentAuthScenario = 'premium';

jest.mock('../../../../src/utils/auth-helpers', () => ({
  requireAuth: jest.fn(() => {
    if (currentAuthScenario === 'unauthenticated') {
      throw new Error('Unauthorized');
    }
    return Promise.resolve(mockAuthScenarios[currentAuthScenario]);
  }),
  handleAuthError: jest.fn((error) => ({
    json: () => Promise.resolve({ error: error.message }),
    status: 401,
  })),
}));

// Mock db helpers
const mockCollectionMethods = {
  find: jest.fn(() => ({
    skip: jest.fn(() => ({
      limit: jest.fn(() => ({
        toArray: jest.fn()
      }))
    }))
  })),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  insertOne: jest.fn()
};

jest.mock('../../../../src/utils/db-helpers', () => ({
  getCollection: jest.fn(() => Promise.resolve(mockCollectionMethods))
}));

import { POST, GET, createListingsHandlers } from '../../../../app/api/listings/route';
import { createMocks, MockNextRequest, MockNextResponse } from '../../../../__mocks__/next/server';
import { ApiResponseHandler } from '../../../../src/utils/api-response';

// Helper to simulate Next.js API handler invocation
function runHandler(handler: (req: any) => any, req: any): any {
  return handler(req);
}

describe('Listings API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentAuthScenario = 'premium';
    
    // Set up default mock responses
    mockCollectionMethods.find.mockReturnValue({
      skip: jest.fn(() => ({
        limit: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([
            { _id: '1', title: 'Test Listing 1', slug: 'test-1' },
            { _id: '2', title: 'Test Listing 2', slug: 'test-2' }
          ])
        }))
      }))
    });
    mockCollectionMethods.countDocuments.mockResolvedValue(25);
    mockCollectionMethods.findOne.mockResolvedValue(null);
    mockCollectionMethods.insertOne.mockResolvedValue({ insertedId: 'new-listing-id' });
  });

  describe('GET /api/listings', () => {
    it('should return a list of listings with default pagination', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(GET, req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.listings).toBeDefined();
      expect(Array.isArray(data.data.listings)).toBe(true);
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        pages: 3,
      });
    });

    it('should handle custom pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=2&limit=5',
      });

      const response = await runHandler(GET, req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 25,
        pages: 5,
      });

      // Verify skip/limit were called correctly
      expect(mockCollectionMethods.find().skip).toHaveBeenCalledWith(5); // (2-1)*5
      expect(mockCollectionMethods.find().skip().limit).toHaveBeenCalledWith(5);
    });

    it('should handle invalid pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=invalid&limit=abc',
      });

      const response = await runHandler(GET, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Invalid pagination parameters', 400);
    });

    it('should handle negative pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=-1&limit=-5',
      });

      const response = await runHandler(GET, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Invalid pagination parameters', 400);
    });

    it('should handle zero pagination parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=0&limit=0',
      });

      const response = await runHandler(GET, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Invalid pagination parameters', 400);
    });

    it('should handle malformed request', async () => {
      const response = await runHandler(GET, null);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Malformed request', 400);
    });

    it('should handle malformed request URL', async () => {
      const response = await runHandler(GET, { url: null });

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Malformed request', 400);
    });

    it('should handle collection unavailable', async () => {
      jest.mocked(require('../../../../src/utils/db-helpers').getCollection).mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=1&limit=10',
      });

      const response = await runHandler(GET, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Listings collection unavailable', 500);
    });

    it('should handle collection without find method', async () => {
      jest.mocked(require('../../../../src/utils/db-helpers').getCollection).mockResolvedValue({});

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=1&limit=10',
      });

      const response = await runHandler(GET, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Listings collection unavailable', 500);
    });

    it('should handle database errors', async () => {
      mockCollectionMethods.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=1&limit=10',
      });

      const response = await runHandler(GET, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Failed to fetch listings');
    });

    it('should handle ApiResponseHandler returning null', async () => {
      (ApiResponseHandler.success as jest.Mock).mockReturnValue(null);

      const { req } = createMocks({
        method: 'GET',
        url: 'http://localhost/api/listings?page=1&limit=10',
      });

      const response = await runHandler(GET, req);

      // Should fallback to direct response when ApiResponseHandler returns null
      expect(response.listings).toBeDefined();
      expect(response.pagination).toBeDefined();
    });
  });

  describe('POST /api/listings', () => {
    it('should create a new listing for premium user', async () => {
      const listingData = {
        title: 'Test Listing',
        slug: 'test-listing',
        category: 'coworking',
        description: 'A detailed description for the test listing that meets the minimum 10 character requirement.',
        location: 'Bangkok, Thailand',
      };

      const { req } = createMocks({
        method: 'POST',
        json: listingData,
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(mockCollectionMethods.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...listingData,
          ownerId: 'test-user-id',
          status: 'active',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );

      expect(ApiResponseHandler.success).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-listing-id',
          ...listingData,
        }),
        'Listing created successfully'
      );
    });

    it('should reject non-premium users', async () => {
      currentAuthScenario = 'basic';

      const { req } = createMocks({
        method: 'POST',
        json: { title: 'Test' },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.forbidden).toHaveBeenCalled();
    });

    it('should handle unauthenticated requests', async () => {
      currentAuthScenario = 'unauthenticated';

      const { req } = createMocks({
        method: 'POST',
        json: { title: 'Test' },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(require('../../../../src/utils/auth-helpers').handleAuthError).toHaveBeenCalled();
    });

    it('should handle invalid JSON request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: null, // This will cause json() to throw
        url: 'http://localhost/api/listings',
      });

      // Mock request.json to throw
      req.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Invalid JSON', 400);
    });

    it('should handle missing request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: null,
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Missing or invalid request body', 400);
    });

    it('should handle non-object request body', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: 'not an object',
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Missing or invalid request body', 400);
    });

    it('should validate listing data - missing title', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: {
          slug: 'test-listing',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        'Invalid listing data',
        400,
        ['Title must be at least 3 characters.']
      );
    });

    it('should validate listing data - short title', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Hi',
          slug: 'test-listing',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        'Invalid listing data',
        400,
        ['Title must be at least 3 characters.']
      );
    });

    it('should validate listing data - short description', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Test Listing',
          slug: 'test-listing',
          category: 'coworking',
          description: 'Short',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        'Invalid listing data',
        400,
        ['Description must be at least 10 characters.']
      );
    });

    it('should validate listing data - invalid slug', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Test Listing',
          slug: 'Invalid Slug!',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        'Invalid listing data',
        400,
        ['Slug is required and must be URL-friendly.']
      );
    });

    it('should validate listing data - multiple validation errors', async () => {
      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Hi',
          slug: 'Invalid Slug!',
          description: 'Short',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith(
        'Invalid listing data',
        400,
        expect.arrayContaining([
          'Title must be at least 3 characters.',
          'Description must be at least 10 characters.',
          'Slug is required and must be URL-friendly.',
          'Category is required.',
          'Location is required.',
        ])
      );
    });

    it('should handle duplicate slug', async () => {
      mockCollectionMethods.findOne.mockResolvedValue({ _id: 'existing', slug: 'test-listing' });

      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Test Listing',
          slug: 'test-listing',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Listing with this slug already exists', 409);
    });

    it('should handle collection unavailable during creation', async () => {
      jest.mocked(require('../../../../src/utils/db-helpers').getCollection).mockResolvedValue(null);

      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Test Listing',
          slug: 'test-listing',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Listings collection unavailable', 500);
    });

    it('should handle collection without findOne method', async () => {
      jest.mocked(require('../../../../src/utils/db-helpers').getCollection).mockResolvedValue({});

      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Test Listing',
          slug: 'test-listing',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Listings collection unavailable', 500);
    });

    it('should handle database insertion errors', async () => {
      mockCollectionMethods.insertOne.mockRejectedValue(new Error('Database insertion failed'));

      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Test Listing',
          slug: 'test-listing',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Failed to create listing', 500);
    });

    it('should handle ApiResponseHandler returning null for POST', async () => {
      (ApiResponseHandler.success as jest.Mock).mockReturnValue(null);

      const { req } = createMocks({
        method: 'POST',
        json: {
          title: 'Test Listing',
          slug: 'test-listing',
          category: 'coworking',
          description: 'A detailed description',
          location: 'Bangkok, Thailand',
        },
        url: 'http://localhost/api/listings',
      });

      const response = await runHandler(POST, req);

      // Should fallback to direct response when ApiResponseHandler returns null
      expect(response.id).toBe('new-listing-id');
      expect(response.title).toBe('Test Listing');
      expect(response.message).toBe('Listing created successfully');
    });
  });

  describe('UNSUPPORTED method', () => {
    it('should handle unsupported HTTP methods', async () => {
      const { UNSUPPORTED } = require('../../../../app/api/listings/route');
      
      const response = await UNSUPPORTED();

      expect(ApiResponseHandler.error).toHaveBeenCalledWith('Method Not Allowed', 405);
    });
  });

  describe('Factory function', () => {
    it('should create handlers with injected dependencies', () => {
      const mockDependencies = {
        ApiResponseHandler: {
          success: jest.fn(),
          error: jest.fn(),
          forbidden: jest.fn(),
        },
        handleAuthError: jest.fn(),
        requireAuth: jest.fn(),
        getCollection: jest.fn(),
      };

      const handlers = createListingsHandlers(mockDependencies);

      expect(handlers.GET).toBeDefined();
      expect(handlers.POST).toBeDefined();
      expect(handlers.UNSUPPORTED).toBeDefined();
      expect(typeof handlers.GET).toBe('function');
      expect(typeof handlers.POST).toBe('function');
      expect(typeof handlers.UNSUPPORTED).toBe('function');
    });
  });
});
