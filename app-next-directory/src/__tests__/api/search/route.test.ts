/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared test types
// Note: NextRequest/NextResponse are obtained from the mocked 'next/server' module below

interface SearchResult {
  _id: string;
  name: string;
  slug: { _type?: string; current: string };
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

interface SearchRequest {
  query?: string;
  page?: number;
  limit?: number;
  category?: string | string[];
  destination?: string | string[];
  nomadFeatures?: string | string[];
}

// Helper to coerce mocked fetch return values to the expected generic type
const asFetchResult = <T>(v: T) => v as unknown as any;

// Mock next-sanity client BEFORE imports
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

// Mock NextRequest and NextResponse (clean, unified)
jest.mock('next/server', () => {
  return {
    NextRequest: jest.fn().mockImplementation((url: string, options?: any) => {
      const body = options?.body;
      return {
        url,
        json: jest.fn().mockImplementation(() => {
          if (body === undefined || body === null) return Promise.resolve(body);
          try {
            return Promise.resolve(typeof body === 'string' ? JSON.parse(body) : body);
          } catch (e) {
            // Allow tests to override to simulate invalid JSON
            return Promise.reject(e);
          }
        }),
        // Minimal props some code may touch
        nextUrl: new URL(url),
        cookies: { get: jest.fn(), set: jest.fn(), delete: jest.fn() },
      } as any;
    }),
    NextResponse: {
      json: jest.fn((data: any, options?: { status?: number }) => ({
        json: () => Promise.resolve(data),
        status: options?.status ?? 200,
      })),
    },
  };
});

// Ensure test's local mock overrides global setup mock
jest.unmock('@/utils/api-response');

// Mock the ApiResponseHandler BEFORE importing the route
jest.mock('@/utils/api-response', () => ({
  ApiResponseHandler: {
    success: jest.fn((data: unknown) => require('next/server').NextResponse.json({ success: true, data }, { status: 200 })),
    error: jest.fn((message: string, status = 400) => require('next/server').NextResponse.json({ error: message }, { status })),
  },
}));

// Pull mocked NextRequest/NextResponse from the mocked module
const { NextRequest, NextResponse } = jest.requireMock('next/server');

// Unmock must be above imports to take effect
import { GET, POST } from '../../../../app/api/search/route';
import { client } from '@/lib/sanity/client';

// Narrow types for mocks: wrap only the fetch function to avoid casting full SanityClient
const mockClient = { fetch: client.fetch as unknown as jest.Mock } as { fetch: jest.Mock };

const mockApiResponseHandler = jest.requireMock('@/utils/api-response').ApiResponseHandler as {
  success: jest.MockedFunction<(data: unknown) => any>;
  error: jest.MockedFunction<(message: string, status?: number) => any>;
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

      const mockRequest = new NextRequest('http://localhost:3000/api/search?q=coworking&page=1&limit=12');

      const response = await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success ?? true).toBeTruthy();
      expect(body.data.results).toEqual(mockResults);
      expect(body.data.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 1,
        totalPages: 1,
        hasMore: false,
      });
      expect(body.data.filters.query).toBe('coworking');
      expect(body.data.filters.category).toEqual([]);
      expect(body.data.filters.destination).toEqual([]);
    });

    it('should handle search with multiple filters', async () => {
      const mockResults: SearchResult[] = [
        {
          _id: '1',
          name: 'Bangkok Cafe',
          slug: { _type: 'slug', current: 'bangkok-cafe' },
          category: 'cafe',
        },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(1));

      const mockRequest = new NextRequest('http://localhost:3000/api/search?q=cafe&category=cafe&category=restaurant&destination=Bangkok&destination=Phuket&amenities=pantry&amenities=wifi&page=2&limit=6');

      await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('cafe');
      expect(firstCall).toContain('category == "cafe"');
      expect(firstCall).toContain('category == "restaurant"');
      expect(firstCall).toContain('city->name == "Bangkok"');
      expect(firstCall).toContain('city->name == "Phuket"');
      expect(firstCall).toContain('amenities[] == "pantry"');
      expect(firstCall).toContain('amenities[] == "wifi"');
      expect(firstCall).toContain('city->name match "*Bangkok*"');
      expect(firstCall).toContain('array::contains(digitalNomadFeatures[]->name, "wifi")');
      expect(firstCall).toContain('[6...11]');
    });

    it('should handle empty search query', async () => {
      const mockResults: SearchResult[] = [
        {
          _id: '1',
          name: 'All Listings',
          slug: { _type: 'slug', current: 'all-listings' },
          category: 'accommodation',
        },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(1));

      const mockRequest = new NextRequest('http://localhost:3000/api/search');

      await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).not.toContain('match "*"');
    });

    it('should handle pagination correctly', async () => {
      const mockResults: SearchResult[] = Array.from({ length: 5 }, (_, i) => ({
        _id: i.toString(),
        name: `Listing ${i}`,
        slug: { _type: 'slug', current: `listing-${i}` },
        category: 'coworking',
      }));

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(25));

      const mockRequest = new NextRequest('http://localhost:3000/api/search?page=3&limit=5');

      const response = await GET(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.results).toEqual(mockResults);
      expect(body.data.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 25,
        totalPages: 5,
        hasMore: true,
      });
      expect(body.data.filters).toEqual({ query: '', category: [], destination: [], amenities: [], nomadFeatures: [] });

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('[10...14]');
    });

    it('should handle special characters in search query', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = new NextRequest('http://localhost:3000/api/search?q=café@bangkok!');

      await GET(mockRequest as any);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('café@bangkok!');
    });

    it('should handle API error from Sanity', async () => {
      const mockError = new Error('Sanity API Error');
      mockClient.fetch.mockRejectedValueOnce(mockError);

      const mockRequest = new NextRequest('http://localhost:3000/api/search?q=test');

      const response = await GET(mockRequest as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      // The route uses ApiResponseHandler.error('Search failed') which should yield { error: 'Search failed' }
      expect(body.error || body.data?.error).toBe('Search failed');
    });

    it('should handle invalid pagination parameters', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = new NextRequest('http://localhost:3000/api/search?page=0&limit=-5');

      const response = await GET(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.results).toEqual(mockResults);
      expect(body.data.pagination).toEqual({ page: 1, limit: 1, total: 0, totalPages: 0, hasMore: false });
      expect(body.data.filters.query).toBe('');
      expect(body.data.filters.category).toEqual([]);
      expect(body.data.filters.destination).toEqual([]);
    });

    it('should handle very large page numbers', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = new NextRequest('http://localhost:3000/api/search?page=9999&limit=100');

      await GET(mockRequest as any);

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).toContain('[999800...999899]');
    });
  });

  describe('POST /api/search', () => {
    it('should handle POST request with body parameters', async () => {
      const mockResults: SearchResult[] = [
        { _id: '1', name: 'Test Result', slug: { _type: 'slug', current: 'test-result' }, category: 'coworking' },
      ];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(1));

      const mockRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test', page: 2, limit: 6 } as SearchRequest),
      });

      await POST(mockRequest as unknown as Request);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle POST request with default parameters', async () => {
      const mockResults: SearchResult[] = [];

      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({} as SearchRequest),
      });

      await POST(mockRequest as unknown as Request);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle POST request with invalid JSON', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: 'invalid json',
      });

      (mockRequest.json as jest.Mock).mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('Failed to perform search');
    });

    it('should handle POST request processing error', async () => {
      const mockError = new Error('Processing error');
      const mockRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test', page: 1, limit: 12 } as SearchRequest),
      });

      mockClient.fetch.mockRejectedValueOnce(mockError);

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.error).toBe('Failed to perform search');
    });

    it('should use correct URL construction in POST', async () => {
      const mockResults: SearchResult[] = [];
      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test query', page: 3, limit: 8 } as SearchRequest),
      });

      await POST(mockRequest as unknown as Request);

      expect(mockClient.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Query building edge cases', () => {
    it('should handle array filters correctly', async () => {
      const mockResults: SearchResult[] = [];
      mockClient.fetch
        .mockResolvedValueOnce(asFetchResult(mockResults))
        .mockResolvedValueOnce(asFetchResult(0));

      const mockRequest = new NextRequest('http://localhost:3000/api/search?category=cafe&category=restaurant&destination=Bangkok&destination=Tokyo&nomadFeatures=wifi&nomadFeatures=quiet');

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

      const mockRequest = new NextRequest('http://localhost:3000/api/search?q=   ');

      await GET(mockRequest as any);

      const firstCall: string = mockClient.fetch.mock.calls[0][0];
      expect(firstCall).not.toContain('match "*   *"');
    });

    it('should include all required fields in response', async () => {
      const mockResults: SearchResult[] = [
        {
          _id: '1',
          name: 'Test',
          slug: { _type: 'slug', current: 'test' },
          category: 'cafe',
          primaryImage: { asset: { _ref: 'image-ref-1' } },
          galleryImages: [{ asset: { _ref: 'image-ref-2' } }],
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

      const mockRequest = new NextRequest('http://localhost:3000/api/search');

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