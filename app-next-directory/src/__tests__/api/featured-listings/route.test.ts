/**
 * Jest Test Suite for Featured Listings API Route
 * Tests covering:
 * 1. GET /api/featured-listings - Fetch featured listings
 * 2. Data transformation and validation
 * 3. Error handling for database failures
 */

import { jest } from '@jest/globals';

// Mock dependencies
const mockFetch = jest.fn();
const mockGetClient = jest.fn(() => ({ fetch: mockFetch }));
const mockApiResponseHandler = {
  success: jest.fn((data) => ({
    json: () => Promise.resolve(data),
    status: 200,
  })),
  error: jest.fn((message, status, details) => ({
    json: () => Promise.resolve({ error: message, details }),
    status,
  })),
};
const mockStructuredLogger = {
  apiError: jest.fn(),
};
const mockGetRequestContext = jest.fn(() => ({}));

jest.mock('@/lib/sanity.utils', () => ({
  getClient: mockGetClient,
}));

jest.mock('@/utils/api-response', () => ({
  ApiResponseHandler: mockApiResponseHandler,
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: mockStructuredLogger,
  getRequestContext: mockGetRequestContext,
}));

// Import the route handler after mocks are set up
import { GET } from '@/app/api/featured-listings/route';

describe('Featured Listings API - GET /api/featured-listings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Requests', () => {
    it('should return featured listings with valid data', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Green Coworking Space',
          slug: 'green-coworking',
          imageUrl: 'https://example.com/image1.jpg',
          city: 'Bali',
          amenityNames: ['WiFi', 'Coffee'],
        },
        {
          _id: 'listing-2',
          name: 'Eco Hostel',
          slug: 'eco-hostel',
          imageUrl: 'https://example.com/image2.jpg',
          city: 'Chiang Mai',
          amenityNames: ['Kitchen', 'Garden'],
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const mockRequest = {} as Request;
      const response = await GET(mockRequest);

      expect(mockApiResponseHandler.success).toHaveBeenCalledWith({
        listings: expect.arrayContaining([
          expect.objectContaining({
            id: 'listing-1',
            name: 'Green Coworking Space',
            slug: 'green-coworking',
          }),
        ]),
      });
    });

    it('should filter out listings without required fields', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Valid Listing',
          slug: 'valid-listing',
          imageUrl: 'https://example.com/image1.jpg',
          city: 'Bali',
          amenityNames: ['WiFi'],
        },
        {
          _id: null, // Invalid - no ID
          name: 'Invalid Listing',
          slug: 'invalid',
        },
        {
          _id: 'listing-3',
          name: 'No Slug Listing',
          slug: null, // Invalid - no slug
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockApiResponseHandler.success).toHaveBeenCalledWith({
        listings: expect.arrayContaining([
          expect.objectContaining({
            id: 'listing-1',
          }),
        ]),
      });

      const successCall = mockApiResponseHandler.success.mock.calls[0][0];
      expect(successCall.listings).toHaveLength(1);
    });

    it('should handle empty listings array', async () => {
      mockFetch.mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockApiResponseHandler.success).toHaveBeenCalledWith({
        listings: [],
      });
    });

    it('should handle null results from Sanity', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockApiResponseHandler.success).toHaveBeenCalledWith({
        listings: [],
      });
    });

    it('should clean amenity names by filtering empty strings', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Test Listing',
          slug: 'test-listing',
          imageUrl: 'https://example.com/image.jpg',
          city: 'Bangkok',
          amenityNames: ['WiFi', '', null, 'Coffee', '  '],
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      const successCall = mockApiResponseHandler.success.mock.calls[0][0];
      expect(successCall.listings[0].amenityNames).toEqual(['WiFi', 'Coffee']);
    });

    it('should handle missing amenityNames', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Test Listing',
          slug: 'test-listing',
          imageUrl: 'https://example.com/image.jpg',
          city: 'Bangkok',
          amenityNames: null,
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      const successCall = mockApiResponseHandler.success.mock.calls[0][0];
      expect(successCall.listings[0].amenityNames).toEqual([]);
    });

    it('should use default values for missing optional fields', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: null,
          slug: 'test-listing',
          imageUrl: null,
          city: null,
          amenityNames: [],
        },
      ];

      mockFetch.mockResolvedValueOnce(mockListings);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      const successCall = mockApiResponseHandler.success.mock.calls[0][0];
      expect(successCall.listings[0]).toEqual({
        id: 'listing-1',
        name: '',
        slug: 'test-listing',
        imageUrl: undefined,
        city: '',
        amenityNames: [],
      });
    });

    it('should fetch listings with correct query parameters', async () => {
      mockFetch.mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('_type == "listing"')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('moderation.status == "published"')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('moderation.featured == true')
      );
    });

    it('should limit results to 12 items', async () => {
      mockFetch.mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('[0...12]')
      );
    });

    it('should order by _updatedAt desc', async () => {
      mockFetch.mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('order(_updatedAt desc)')
      );
    });

    it('should filter out drafts', async () => {
      mockFetch.mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('!(_id in path("drafts.**"))')
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when Sanity fetch fails', async () => {
      const error = new Error('Sanity fetch failed');
      mockFetch.mockRejectedValueOnce(error);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockApiResponseHandler.error).toHaveBeenCalledWith(
        'Failed to fetch featured listings',
        500,
        'Sanity fetch failed'
      );
    });

    it('should log error details', async () => {
      const error = new Error('Database connection failed');
      mockFetch.mockRejectedValueOnce(error);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockStructuredLogger.apiError).toHaveBeenCalledWith(
        '/api/featured-listings',
        error,
        expect.objectContaining({
          operation: 'get_featured_listings',
        })
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockApiResponseHandler.error).toHaveBeenCalledWith(
        'Failed to fetch featured listings',
        500,
        'String error'
      );
    });

    it('should handle network timeout errors', async () => {
      const error = new Error('Request timeout');
      mockFetch.mockRejectedValueOnce(error);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockApiResponseHandler.error).toHaveBeenCalled();
    });

    it('should handle Sanity query errors', async () => {
      const error = new Error('GROQ syntax error');
      mockFetch.mockRejectedValueOnce(error);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockStructuredLogger.apiError).toHaveBeenCalled();
    });
  });

  describe('Client Initialization', () => {
    it('should call getClient with draft mode disabled', async () => {
      mockFetch.mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockGetClient).toHaveBeenCalledWith(false);
    });
  });

  describe('Request Context', () => {
    it('should capture request context for logging', async () => {
      const error = new Error('Test error');
      mockFetch.mockRejectedValueOnce(error);

      const mockRequest = {} as Request;
      await GET(mockRequest);

      expect(mockGetRequestContext).toHaveBeenCalledWith(mockRequest);
    });
  });
});
