import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, testControl } from '../route';

const mockedFetch = jest.fn();
const mockedIsE2ERun = jest.fn();
const mockedBuildE2EResponse = jest.fn();

const createRequest = (input: ConstructorParameters<typeof NextRequest>[0], init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(input, init);

describe('/api/search', () => {
  beforeEach(async () => {
    mockedFetch.mockReset();
    mockedIsE2ERun.mockReset();
    mockedBuildE2EResponse.mockReset();

    testControl.clientFetchOverride = mockedFetch;
    testControl.isE2ERunOverride = mockedIsE2ERun;
    testControl.buildE2ESearchResponseOverride = mockedBuildE2EResponse;
    testControl.parseBodyOverride = undefined;

    mockedIsE2ERun.mockReturnValue(false);
  });

  afterEach(() => {
    testControl.clientFetchOverride = undefined;
    testControl.isE2ERunOverride = undefined;
    testControl.buildE2ESearchResponseOverride = undefined;
    testControl.parseBodyOverride = undefined;
  });

  describe('GET', () => {
    it('returns search results with default pagination', async () => {
      const mockResults = [
        { _id: '1', name: 'Test Listing 1', slug: 'test-1' },
      ];
      mockedFetch
        .mockResolvedValueOnce(mockResults) // results query
        .mockResolvedValueOnce(10); // count query
      
      const request = createRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.results).toEqual(mockResults);
      expect(json.data.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 10,
        totalPages: 1,
        hasMore: false,
      });
      expect(json.data.filters.query).toBe('test');
    });

    it('handles pagination parameters', async () => {
      mockedFetch
        .mockResolvedValueOnce([]) // results
        .mockResolvedValueOnce(100); // count
      
      const request = createRequest('http://localhost:3000/api/search?page=2&limit=20');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.pagination).toEqual({
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
      
      const request = createRequest('http://localhost:3000/api/search?category=cafe&category=coworking');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.filters.category).toEqual(['cafe', 'coworking']);
    });

    it('includes facets when requested', async () => {
      const mockFacetData = [
        { category: 'cafe', destination: 'Bangkok', amenities: ['wifi', 'coffee'] },
      ];
      mockedFetch
        .mockResolvedValueOnce([]) // results
        .mockResolvedValueOnce(0) // count
        .mockResolvedValueOnce(mockFacetData); // facets
      
      const request = createRequest('http://localhost:3000/api/search?facets=true');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.facets).toBeDefined();
      expect(json.data.facets.category).toBeInstanceOf(Array);
      expect(json.data.facets.destination).toBeInstanceOf(Array);
      expect(json.data.facets.amenities).toBeInstanceOf(Array);
    });

    it('handles search errors', async () => {
      mockedFetch.mockRejectedValue(new Error('Sanity error'));
      
      const request = createRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Search failed');
    });

    it('validates query length', async () => {
      const longQuery = 'a'.repeat(300);
      mockedFetch.mockRejectedValue(new Error('Search query too long'));
      
      const request = createRequest(`http://localhost:3000/api/search?q=${longQuery}`);
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
      
      testControl.parseBodyOverride = async () => ({ query: 'test', page: 1, limit: 10 });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.results).toEqual(mockResults);
      expect(json.data.pagination.page).toBe(1);
      expect(json.data.pagination.limit).toBe(10);
    });

    it('handles invalid JSON', async () => {
      testControl.parseBodyOverride = async () => {
        throw new Error('invalid json');
      };

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
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
      
      testControl.parseBodyOverride = async () => ({
        query: 'test',
        category: ['cafe'],
        destination: ['Bangkok'],
        amenities: ['wifi'],
        nomadFeatures: ['fast-internet'],
      });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(json.data.filters.category).toEqual(['cafe']);
      expect(json.data.filters.destination).toEqual(['Bangkok']);
      expect(json.data.filters.amenities).toEqual(['wifi']);
      expect(json.data.filters.nomadFeatures).toEqual(['fast-internet']);
    });

    it('handles POST errors', async () => {
      mockedFetch.mockRejectedValue(new Error('Database error'));
      
      testControl.parseBodyOverride = async () => ({ query: 'test' });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Failed to perform search');
    });
  });
});
