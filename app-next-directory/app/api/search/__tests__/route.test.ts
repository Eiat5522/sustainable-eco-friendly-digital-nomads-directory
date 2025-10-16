import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { client } from '@/lib/sanity/client';
import { isE2ERun } from '@/data/e2e/discovery-fixtures';

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

jest.mock('@/data/e2e/discovery-fixtures', () => ({
  buildE2ESearchResponse: jest.fn(),
  isE2ERun: jest.fn(() => false),
}));

let mockedFetch: jest.Mock;
let mockedIsE2ERun: jest.Mock;

describe('/api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;
    mockedIsE2ERun = isE2ERun as jest.Mock;
    mockedIsE2ERun.mockReturnValue(false);
  });

  describe('GET', () => {
    it('returns search results with default pagination', async () => {
      const mockResults = [
        { _id: '1', name: 'Test Listing 1', slug: 'test-1' },
      ];
      mockedFetch
        .mockResolvedValueOnce(mockResults) // results query
        .mockResolvedValueOnce(10); // count query
      
      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.results).toEqual(mockResults);
      expect(json.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 10,
        totalPages: 1,
        hasMore: false,
      });
      expect(json.filters.query).toBe('test');
    });

    it('handles pagination parameters', async () => {
      mockedFetch
        .mockResolvedValueOnce([]) // results
        .mockResolvedValueOnce(100); // count
      
      const request = new NextRequest('http://localhost:3000/api/search?page=2&limit=20');
      const response = await GET(request);
      const json = await response.json();

      expect(json.pagination).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasMore: true,
      });
    });

    it('handles category filters', async () => {
      mockedFetch
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(0);
      
      const request = new NextRequest('http://localhost:3000/api/search?category=cafe&category=coworking');
      const response = await GET(request);
      const json = await response.json();

      expect(json.filters.category).toEqual(['cafe', 'coworking']);
    });

    it('includes facets when requested', async () => {
      const mockFacetData = [
        { category: 'cafe', destination: 'Bangkok', amenities: ['wifi', 'coffee'] },
      ];
      mockedFetch
        .mockResolvedValueOnce([]) // results
        .mockResolvedValueOnce(0) // count
        .mockResolvedValueOnce(mockFacetData); // facets
      
      const request = new NextRequest('http://localhost:3000/api/search?facets=true');
      const response = await GET(request);
      const json = await response.json();

      expect(json.facets).toBeDefined();
      expect(json.facets.category).toBeInstanceOf(Array);
      expect(json.facets.destination).toBeInstanceOf(Array);
      expect(json.facets.amenities).toBeInstanceOf(Array);
    });

    it('handles search errors', async () => {
      mockedFetch.mockRejectedValue(new Error('Sanity error'));
      
      const request = new NextRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Search failed');
    });

    it('validates query length', async () => {
      const longQuery = 'a'.repeat(300);
      mockedFetch.mockRejectedValue(new Error('Search query too long'));
      
      const request = new NextRequest(`http://localhost:3000/api/search?q=${longQuery}`);
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('POST', () => {
    it('handles JSON body search', async () => {
      const mockResults = [
        { _id: '1', name: 'Test Listing 1' },
      ];
      mockedFetch
        .mockResolvedValueOnce(mockResults)
        .mockResolvedValueOnce(5);
      
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test', page: 1, limit: 10 }),
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.results).toEqual(mockResults);
      expect(json.pagination.page).toBe(1);
      expect(json.pagination.limit).toBe(10);
    });

    it('handles invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: 'invalid json',
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Failed to perform search');
    });

    it('handles filters in POST body', async () => {
      mockedFetch
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(0);
      
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          category: ['cafe'],
          destination: ['Bangkok'],
          amenities: ['wifi'],
          nomadFeatures: ['fast-internet'],
        }),
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(json.filters.category).toEqual(['cafe']);
      expect(json.filters.destination).toEqual(['Bangkok']);
      expect(json.filters.amenities).toEqual(['wifi']);
      expect(json.filters.nomadFeatures).toEqual(['fast-internet']);
    });

    it('handles POST errors', async () => {
      mockedFetch.mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Failed to perform search');
    });
  });
});
