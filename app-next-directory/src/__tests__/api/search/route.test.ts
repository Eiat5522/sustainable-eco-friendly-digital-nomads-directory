// Shared test types
interface SearchResult {
  _id: string;
  name: string;
  slug: string | { _type?: string; current: string };
  category: string;
  primaryImage?: { asset: { _ref?: string } };
  galleryImages?: any[];
  location?: any;
  priceRange?: string;
  moderation?: { status: string };
  shortDescription?: string;
  longDescription?: any;
  ecoFocusTags?: string[];
  ecoFeatures?: string[];
  amenities?: string[];
}

// Helper to coerce mocked fetch return values to the expected generic type
const asFetchResult = <T>(v: T) => v as unknown as any;
// Mock next-sanity client BEFORE imports
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

// Mock API response handler BEFORE imports
jest.mock('@/utils/api-response', () => ({
  ApiResponseHandler: {
    success: jest.fn((data: unknown) => ({
      json: () => Promise.resolve({ success: true, data }),
      status: 200,
    })),
    error: jest.fn((message: string, status = 500) => ({
      json: () => Promise.resolve({ error: message }),
      status,
    })),
  },
}));

// Mock NextRequest and NextResponse
jest.mock('next/dist/server/web/spec-extension/request', () => {
  return {
    NextRequest: jest.fn().mockImplementation((url: string) => ({
      url,
    })),
  };
});

jest.mock('next/dist/server/web/spec-extension/response', () => {
  return {
    NextResponse: {
      json: jest.fn((data: any, options: { status?: number } | undefined) => ({
        json: () => Promise.resolve(data),
        status: options?.status || 200,
      })),
    },
  };
});

import { GET, POST } from '../../../../app/api/search/route';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';

// Narrow types for mocks: wrap only the fetch function to avoid casting full SanityClient
const mockClient = { fetch: client.fetch as unknown as jest.Mock } as { fetch: jest.Mock };
const mockApiResponseHandler = ApiResponseHandler as unknown as {
  success: jest.Mock;
  error: jest.Mock;
};

describe('Search API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('GET /api/search', () => {
    it('should handle basic search query', async () => {
      const mockResults: SearchResult[] = [
        {
          _id: '1',
          name: 'Test Coworking Space',
          slug: { _type: 'slug', current: 'test-coworking' },
          category: 'coworking',
          primaryImage: { asset: { _ref: 'image-ref-1' } },
          galleryImages: [],
          location: { lat: 1, lng: 1 },
          priceRange: 'moderate',
          moderation: { status: 'published' },
          shortDescription: 'short',
          longDescription: [],
          ecoFocusTags: ['eco1'],
          amenities: [],
        },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults)) // For search results
        .mockResolvedValueOnce(asFetchResult(1)); // For count

      const mockRequest = {
        url: 'http://localhost:3000/api/search?q=coworking&page=1&limit=12',
      };

      await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      expect(mockApiResponseHandler.success).toHaveBeenCalledWith({
        results: mockResults,
        pagination: {
          page: 1,
          limit: 12,
            total: 1,
          totalPages: 1,
          hasMore: false,
        },
        filters: {
          query: 'coworking',
          category: [],
          destination: [],
        },
      });
    });

    it('should handle search with multiple filters', async () => {
      const mockResults: SearchResult[] = [
        {
          _id: '1',
          name: 'Bangkok Cafe',
          slug: 'bangkok-cafe',
          category: 'cafe',
        },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(1));

      const mockRequest = {
        url: 'http://localhost:3000/api/search?q=cafe&category=cafe&category=restaurant&destination=Bangkok&nomadFeatures=wifi&page=2&limit=6',
      };

      await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('cafe');
      expect(firstCall).toContain('category == "cafe"');
      expect(firstCall).toContain('category == "restaurant"');
      expect(firstCall).toContain('city->name match "*Bangkok*"');
      expect(firstCall).toContain('array::contains(digitalNomadFeatures[]->name, "wifi")');
      expect(firstCall).toContain('[6...11]');
    });
    it('should handle empty search query', async () => {
      const mockResults: SearchResult[] = [
        {
          _id: '1',
          name: 'All Listings',
          slug: 'all-listings',
          category: 'accommodation',
        },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(1));

      const mockRequest = { url: 'http://localhost:3000/api/search' };

      await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).not.toContain('match "*"');
    });

    it('should handle pagination correctly', async () => {
      const mockResults: SearchResult[] = Array.from({ length: 5 }, (_, i) => ({
        _id: i.toString(),
        name: `Listing ${i}`,
        slug: `listing-${i}`,
        category: 'coworking',
      }));

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(25));

      const mockRequest = { url: 'http://localhost:3000/api/search?page=3&limit=5' };

      await GET(mockRequest as any);

      expect(mockApiResponseHandler.success).toHaveBeenCalledWith({
        results: mockResults,
        pagination: {
          page: 3,
          limit: 5,
          total: 25,
          totalPages: 5,
          hasMore: true,
        },
        filters: { query: '', category: [], destination: [] },
      });

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('[10...14]');
    });

    it('should handle special characters in search query', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = { url: 'http://localhost:3000/api/search?q=café@bangkok!' };

      await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('café@bangkok!');
    });

    it('should handle API error from Sanity', async () => {
      const mockError = new Error('Sanity API Error');
      mockClient.fetch.mockRejectedValueOnce(mockError);

      const mockRequest = { url: 'http://localhost:3000/api/search?q=test' };

      await GET(mockRequest as any);

      expect(mockApiResponseHandler.error).toHaveBeenCalledWith('Search failed');
    });

    it('should handle invalid pagination parameters', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = { url: 'http://localhost:3000/api/search?page=0&limit=-5' };

      await GET(mockRequest as any);

      expect(mockApiResponseHandler.success).toHaveBeenCalledWith({
        results: mockResults,
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
        filters: { query: '', category: [], destination: [] },
      });
    });

    it('should handle very large page numbers', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = { url: 'http://localhost:3000/api/search?page=9999&limit=100' };

      await GET(mockRequest as any);

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('[999800...999899]');
    });
  });
  describe('POST /api/search', () => {
    it('should handle POST request with body parameters', async () => {
      const mockResults: SearchResult[] = [
        { _id: '1', name: 'Test Result', slug: 'test-result', category: 'coworking' },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(1));

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ query: 'test', page: 2, limit: 6 }),
      };

      await POST(mockRequest as any);

      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle POST request with default parameters', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      };

      await POST(mockRequest as any);

      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle POST request with invalid JSON', async () => {
      const mockRequest = { json: jest.fn().mockRejectedValue(new Error('Invalid JSON')) };

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe('Failed to perform search');
    });

    it('should handle POST request processing error', async () => {
      const mockError = new Error('Processing error');
      const mockRequest = { json: jest.fn().mockResolvedValue({ query: 'test', page: 1, limit: 12 }) };
      mockClient.fetch.mockRejectedValueOnce(mockError);

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.error).toBe('Failed to perform search');
    });

    it('should use correct URL construction in POST', async () => {
      const mockResults: SearchResult[] = [];
      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = { json: jest.fn().mockResolvedValue({ query: 'test query', page: 3, limit: 8 }) };

      await POST(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
    });
  });
  describe('Query building edge cases', () => {
    it('should handle array filters correctly', async () => {
      const mockResults: SearchResult[] = [];
      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = { url: 'http://localhost:3000/api/search?category=cafe&category=restaurant&destination=Bangkok&destination=Tokyo&nomadFeatures=wifi&nomadFeatures=quiet' };

      await GET(mockRequest as any);

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('category == "cafe" || category == "restaurant"');
      expect(firstCall).toContain('city->name match "*Bangkok*" || city->name match "*Tokyo*"');
      expect(firstCall).toContain('array::contains(digitalNomadFeatures[]->name, "wifi") || array::contains(digitalNomadFeatures[]->name, "quiet")');
    });

    it('should handle whitespace-only search query', async () => {
      const mockResults: SearchResult[] = [];
      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = { url: 'http://localhost:3000/api/search?q=   ' };

      await GET(mockRequest as any);

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).not.toContain('match "*   *"');
    });

    it('should include all required fields in response', async () => {
      const mockResults: SearchResult[] = [
        {
          _id: '1',
          name: 'Test',
          slug: 'test',
          category: 'cafe',
          primaryImage: { asset: {} },
          galleryImages: [{ asset: {} }],
          location: { _id: '1', name: 'Bangkok', slug: { current: 'bangkok' }, country: 'Thailand' },
          priceRange: 'budget',
          moderation: { status: 'published' },
          shortDescription: 'Test description',
          longDescription: 'Long test description',
          ecoFeatures: ['solar'],
          amenities: ['wifi'],
        },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(1));

      const mockRequest = { url: 'http://localhost:3000/api/search' };

      await GET(mockRequest as any);

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('_id');
      expect(firstCall).toContain('name');
      expect(firstCall).toContain('slug');
      expect(firstCall).toContain('category');
      expect(firstCall).toContain('primaryImage');
      expect(firstCall).toContain('galleryImages');
      expect(firstCall).toContain('location');
      expect(firstCall).toContain('priceRange');
      expect(firstCall).toContain('moderation');
      expect(firstCall).toContain('shortDescription');
      expect(firstCall).toContain('longDescription');
      expect(firstCall).toContain('ecoFeatures');
      expect(firstCall).toContain('amenities');
    });
  });
});
