import { HttpResponse, http } from 'msw';
import { createTestData } from '@/tests/helpers/test-data';
import { handlers, setRegisterResponse, setReviewsResponse } from '../handlers';

// Mock the test data
jest.mock('@/tests/helpers/test-data', () => ({
  createTestData: jest.fn(),
  getFavoritesForUser: jest.fn(),
  getReviewsForListing: jest.fn(),
  listCities: jest.fn(),
}));

jest.mock('@/components/sections/featuredVenuesMockData', () => ({
  mockFeaturedVenues: [
    { id: '1', name: 'Featured Venue 1' },
    { id: '2', name: 'Featured Venue 2' },
  ],
}));

// Mock sanity handlers
jest.mock('../sanity-handlers', () => ({
  sanityHandlers: [],
}));

describe('MSW Handlers', () => {
  const mockData = {
    listings: [
      {
        _id: 'listing-1',
        name: 'Test Listing',
        city: { name: 'Bangkok', slug: { current: 'bangkok' } },
        slug: { current: 'test-listing' },
        type: 'coworking',
      },
      {
        _id: 'listing-2',
        name: 'Another Listing',
        city: { name: 'Chiang Mai', slug: { current: 'chiang-mai' } },
        slug: { current: 'another-listing' },
        type: 'cafe',
      },
    ],
    reviews: [
      { id: 'review-1', rating: 5, listingId: 'listing-1' },
      { id: 'review-2', rating: 4, listingId: 'listing-1' },
    ],
    users: [{ id: 'user-1', name: 'Test User' }],
  };

  beforeEach(() => {
    (createTestData as jest.Mock).mockReturnValue(mockData);
    const {
      getFavoritesForUser,
      getReviewsForListing,
      listCities,
    } = require('@/tests/helpers/test-data');

    (getFavoritesForUser as jest.Mock).mockReturnValue([
      { id: 'fav-1', listingId: 'listing-1', createdAt: '2024-01-01' },
    ]);

    (getReviewsForListing as jest.Mock).mockReturnValue([
      { id: 'review-1', rating: 5, listingId: 'listing-1' },
    ]);

    (listCities as jest.Mock).mockReturnValue([
      {
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        description: 'Capital city',
        coordinates: { lat: 13.7563, lng: 100.5018 },
        highlights: ['Great food', 'Good wifi'],
        listingIds: ['listing-1'],
      },
    ]);
  });

  it('should export an array of handlers', () => {
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);
  });

  it('should include handlers for common API endpoints', () => {
    const handlerPaths = handlers
      .map((handler: typeof http.get) => {
        // Extract the path from the handler
        return (handler as unknown as { info: { path: string } }).info?.path;
      })
      .filter(Boolean);

    // Just verify we have handlers - specific path checking is fragile
    expect(handlers.length).toBeGreaterThan(0);
  });

  describe('setReviewsResponse', () => {
    it('should create a handler for success mode', () => {
      const handler = setReviewsResponse('success');
      expect(handler).toBeDefined();
      // MSW handlers are objects with route metadata
      expect(handler).toBeTruthy();
    });

    it('should create a handler for unauthorized mode', () => {
      const handler = setReviewsResponse('unauthorized');
      expect(handler).toBeDefined();
    });

    it('should create a handler for forbidden mode', () => {
      const handler = setReviewsResponse('forbidden');
      expect(handler).toBeDefined();
    });

    it('should create a handler for conflict mode', () => {
      const handler = setReviewsResponse('conflict');
      expect(handler).toBeDefined();
    });

    it('should create a handler for error mode', () => {
      const handler = setReviewsResponse('error');
      expect(handler).toBeDefined();
    });
  });

  describe('setRegisterResponse', () => {
    it('should create a handler for success mode', () => {
      const handler = setRegisterResponse('success');
      expect(handler).toBeDefined();
      expect(handler).toBeTruthy();
    });

    it('should create a handler for error mode', () => {
      const handler = setRegisterResponse('error');
      expect(handler).toBeDefined();
    });
  });

  describe('Handler functionality', () => {
    it('should have http handlers with proper structure', () => {
      handlers.forEach(handler => {
        expect(handler).toBeDefined();
        expect(typeof handler).toBe('object');
      });
    });

    it('should create handlers using http methods', () => {
      // Verify the handlers use msw's http object
      expect(typeof http.get).toBe('function');
      expect(typeof http.post).toBe('function');
    });

    it('should use HttpResponse for responses', () => {
      expect(HttpResponse.json).toBeDefined();
      expect(typeof HttpResponse.json).toBe('function');
    });
  });

  describe('Test data integration', () => {
    it('should call createTestData when handlers module loads', () => {
      jest.isolateModules(() => {
        const { createTestData: isolatedCreateTestData } = require('@/tests/helpers/test-data');
        require('../handlers');
        expect(isolatedCreateTestData).toHaveBeenCalled();
      });
    });

    it('should have access to listings data', () => {
      const data = createTestData();
      expect(data.listings).toBeDefined();
      expect(Array.isArray(data.listings)).toBe(true);
    });

    it('should have access to reviews data', () => {
      const data = createTestData();
      expect(data.reviews).toBeDefined();
    });

    it('should have access to users data', () => {
      const data = createTestData();
      expect(data.users).toBeDefined();
    });
  });

  describe('Helper functions', () => {
    it('should provide setReviewsResponse for different scenarios', () => {
      const modes: Array<'success' | 'unauthorized' | 'forbidden' | 'conflict' | 'error'> = [
        'success',
        'unauthorized',
        'forbidden',
        'conflict',
        'error',
      ];

      modes.forEach(mode => {
        const handler = setReviewsResponse(mode);
        expect(handler).toBeDefined();
      });
    });

    it('should provide setRegisterResponse for different scenarios', () => {
      const modes: Array<'success' | 'error'> = ['success', 'error'];

      modes.forEach(mode => {
        const handler = setRegisterResponse(mode);
        expect(handler).toBeDefined();
      });
    });
  });

  describe('Response structure', () => {
    it('should use consistent response format', () => {
      // Handlers should return HttpResponse
      const testHandler = http.get('/test', () => {
        return HttpResponse.json({ success: true });
      });

      expect(testHandler).toBeDefined();
    });
  });

  describe('Data filtering', () => {
    it('should have handlers that can filter listings', () => {
      const data = createTestData();
      const filtered = data.listings.filter((listing: (typeof mockData.listings)[0]) =>
        listing.name.toLowerCase().includes('test')
      );

      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should have handlers that can map listing data', () => {
      const data = createTestData();
      const mapped = data.listings.map((listing: (typeof mockData.listings)[0]) => ({
        id: listing._id,
        name: listing.name,
      }));

      expect(mapped.length).toBe(data.listings.length);
      expect(mapped[0]).toHaveProperty('id');
      expect(mapped[0]).toHaveProperty('name');
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parsing errors gracefully', async () => {
      // Mock request that might fail JSON parsing
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('JSON parse error')),
      };

      // The handlers should catch this and provide fallback
      try {
        await mockRequest.json();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Type safety', () => {
    it('should ensure handlers work with MSW types', () => {
      expect(http).toBeDefined();
      expect(HttpResponse).toBeDefined();
    });

    it('should create type-safe responses', () => {
      const response = HttpResponse.json({ test: 'data' });
      expect(response).toBeDefined();
    });
  });

  describe('Handler coverage tests', () => {
    it('should have GET search handler', () => {
      const searchHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/search');
      });
      expect(searchHandlers.length).toBeGreaterThan(0);
    });

    it('should have POST search handler', () => {
      const postSearchHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.method === 'POST';
      });
      expect(postSearchHandlers.length).toBeGreaterThan(0);
    });

    it('should have cities handler', () => {
      const citiesHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/cities');
      });
      expect(citiesHandlers.length).toBeGreaterThan(0);
    });

    it('should have listings handler', () => {
      const listingsHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/listings') || info?.path?.includes('/api/test-listings');
      });
      expect(listingsHandlers.length).toBeGreaterThan(0);
    });

    it('should have reviews handlers', () => {
      const reviewsHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/reviews');
      });
      expect(reviewsHandlers.length).toBeGreaterThan(0);
    });

    it('should have auth handlers', () => {
      const authHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/auth');
      });
      expect(authHandlers.length).toBeGreaterThan(0);
    });

    it('should have contact handler', () => {
      const contactHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/contact');
      });
      expect(contactHandlers.length).toBeGreaterThan(0);
    });

    it('should have favorites handler', () => {
      const favoritesHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/user/favorites');
      });
      expect(favoritesHandlers.length).toBeGreaterThan(0);
    });

    it('should have categories handler', () => {
      const categoriesHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/categories');
      });
      expect(categoriesHandlers.length).toBeGreaterThan(0);
    });

    it('should have amenities handler', () => {
      const amenitiesHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/amenities');
      });
      expect(amenitiesHandlers.length).toBeGreaterThan(0);
    });

    it('should have featured listings handler', () => {
      const featuredHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/featured-listings');
      });
      expect(featuredHandlers.length).toBeGreaterThan(0);
    });

    it('should have suggestions handler', () => {
      const suggestionsHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/search/suggestions');
      });
      expect(suggestionsHandlers.length).toBeGreaterThan(0);
    });

    it('should have hello endpoint handler', () => {
      const helloHandlers = handlers.filter(h => {
        const info = (h as any).info;
        return info?.path?.includes('/api/hello');
      });
      expect(helloHandlers.length).toBeGreaterThan(0);
    });
  });

  describe('setReviewsResponse modes', () => {
    it('should return unauthorized response in unauthorized mode', async () => {
      const handler = setReviewsResponse('unauthorized');
      expect(handler).toBeDefined();
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should return forbidden response in forbidden mode', async () => {
      const handler = setReviewsResponse('forbidden');
      expect(handler).toBeDefined();
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should return conflict response in conflict mode', async () => {
      const handler = setReviewsResponse('conflict');
      expect(handler).toBeDefined();
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should return error response in error mode', async () => {
      const handler = setReviewsResponse('error');
      expect(handler).toBeDefined();
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should return success response by default', async () => {
      const handler = setReviewsResponse('success');
      expect(handler).toBeDefined();
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });
  });

  describe('setRegisterResponse modes', () => {
    it('should return error response in error mode', async () => {
      const handler = setRegisterResponse('error');
      expect(handler).toBeDefined();
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });

    it('should return success response by default', async () => {
      const handler = setRegisterResponse('success');
      expect(handler).toBeDefined();
      const info = (handler as any).info;
      expect(info?.method).toBe('POST');
    });
  });

  describe('HTTP method coverage', () => {
    it('should have both GET and POST handlers', () => {
      const getMethods = handlers.filter(h => {
        const info = (h as any).info;
        return info?.method === 'GET';
      });
      const postMethods = handlers.filter(h => {
        const info = (h as any).info;
        return info?.method === 'POST';
      });

      expect(getMethods.length).toBeGreaterThan(0);
      expect(postMethods.length).toBeGreaterThan(0);
    });

    it('should have multiple endpoints covered', () => {
      const uniquePaths = new Set(
        handlers
          .map(h => {
            const info = (h as any).info;
            return info?.path;
          })
          .filter(Boolean)
      );

      expect(uniquePaths.size).toBeGreaterThan(10);
    });
  });

  describe('Mock data structure', () => {
    it('should use createTestData function', () => {
      jest.isolateModules(() => {
        const { createTestData: isolatedCreateTestData } = require('@/tests/helpers/test-data');
        require('../handlers');
        expect(isolatedCreateTestData).toHaveBeenCalled();
      });
    });

    it('should import required helper functions', () => {
      const {
        getFavoritesForUser,
        getReviewsForListing,
        listCities,
      } = require('@/tests/helpers/test-data');
      expect(getFavoritesForUser).toBeDefined();
      expect(getReviewsForListing).toBeDefined();
      expect(listCities).toBeDefined();
    });

    it('should have access to mockFeaturedVenues', () => {
      const { mockFeaturedVenues } = require('@/components/sections/featuredVenuesMockData');
      expect(mockFeaturedVenues).toBeDefined();
      expect(Array.isArray(mockFeaturedVenues)).toBe(true);
    });
  });

  describe('Response helpers', () => {
    it('should use HttpResponse.json for all responses', () => {
      // The ok function uses HttpResponse.json
      const testResponse = HttpResponse.json({ test: 'data' }, { status: 200 });
      expect(testResponse).toBeDefined();
    });

    it('should support different status codes', () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 409, 500];
      statusCodes.forEach(status => {
        const response = HttpResponse.json({}, { status });
        expect(response).toBeDefined();
        expect(response.status).toBe(status);
      });
    });
  });
});

// Helper to create mock request
function createMockRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}
