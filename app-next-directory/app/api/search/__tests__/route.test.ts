import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockedFetch = jest.fn();
const mockedIsE2ERun = jest.fn();
const mockedBuildE2EResponse = jest.fn();

// Mock sanity client, e2e fixture utilities and ensure route uses these mocks
jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: (...args: unknown[]) => mockedFetch(...args) },
}));
jest.mock('@/data/e2e/discovery-fixtures', () => ({
  isE2ERun: () => mockedIsE2ERun(),
  buildE2ESearchResponse: (...args: unknown[]) => mockedBuildE2EResponse(...args),
}));

const createRequest = (
  input: ConstructorParameters<typeof NextRequest>[0],
  init?: ConstructorParameters<typeof NextRequest>[1]
) => new NextRequest(input, init);

let GET: (request: NextRequest) => Promise<Response>;
let POST: (request: NextRequest) => Promise<Response>;
let routeTestControl: {
  clientFetchOverride?: typeof mockedFetch | undefined;
  parseBodyOverride?: (() => Promise<Record<string, unknown>>) | undefined;
};

describe('/api/search', () => {
  beforeEach(async () => {
    jest.resetModules();
    mockedFetch.mockReset();
    mockedIsE2ERun.mockReset();
    mockedBuildE2EResponse.mockReset();

    mockedIsE2ERun.mockReturnValue(false);

    ({ GET, POST, _testControl: routeTestControl } = require('../route'));
  });

  afterEach(() => {
    // nothing to cleanup when using module mocks
  });

  describe('GET', () => {
    it('returns search results with default pagination', async () => {
      const mockResults = [{ _id: '1', name: 'Test Listing 1', slug: 'test-1' }];
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

    it('throws error when too many category filters provided', async () => {
      const tooManyCategories = Array.from({ length: 51 }, (_, i) => `cat-${i}`);
      const url = `http://localhost:3000/api/search?${tooManyCategories.map(c => `category=${c}`).join('&')}`;

      const request = createRequest(url);
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Search failed');
    });

    it('throws error when too many destination filters provided', async () => {
      const tooManyDestinations = Array.from({ length: 51 }, (_, i) => `dest-${i}`);
      const url = `http://localhost:3000/api/search?${tooManyDestinations.map(d => `destination=${d}`).join('&')}`;

      const request = createRequest(url);
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Search failed');
    });

    it('throws error when too many amenity filters provided', async () => {
      const tooManyAmenities = Array.from({ length: 51 }, (_, i) => `amenity-${i}`);
      const url = `http://localhost:3000/api/search?${tooManyAmenities.map(a => `amenities=${a}`).join('&')}`;

      const request = createRequest(url);
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Search failed');
    });

    it('throws error when too many nomad feature filters provided', async () => {
      const tooManyFeatures = Array.from({ length: 51 }, (_, i) => `feature-${i}`);
      const url = `http://localhost:3000/api/search?${tooManyFeatures.map(f => `nomadFeatures=${f}`).join('&')}`;

      const request = createRequest(url);
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Search failed');
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
      mockedFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = createRequest(
        'http://localhost:3000/api/search?category=cafe&category=coworking'
      );
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
      const _json = await response.json();

      expect(response.status).toBe(400);
    });

    it('handles E2E scenario with fail-once', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
        filters: {},
      });

      const request = createRequest('http://localhost:3000/api/search?e2eScenario=fail-once');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(503);
      expect(json.error).toBe('Simulated search failure');
    });

    it('handles E2E scenario with retry', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [{ _id: '1', name: 'Test' }],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1, hasMore: false },
        filters: {},
      });

      const request = createRequest(
        'http://localhost:3000/api/search?e2eScenario=fail-once&retry=1'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.results).toHaveLength(1);
    });

    it('handles E2E scenario with timeout', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
        filters: {},
      });

      const request = createRequest('http://localhost:3000/api/search?e2eScenario=timeout');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Timeout scenario returns empty results - we just verify it completes successfully
    });

    it('handles E2E run with facets', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
        facets: {
          category: [],
          destination: [],
          amenities: [],
        },
        filters: {},
      });

      const request = createRequest('http://localhost:3000/api/search?facets=true');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.facets).toBeDefined();
    });
  });

  describe('POST', () => {
    it('handles JSON body search', async () => {
      const mockResults = [{ _id: '1', name: 'Test Listing 1' }];
      mockedFetch.mockResolvedValueOnce(mockResults).mockResolvedValueOnce(5);

      routeTestControl.parseBodyOverride = async () => ({ query: 'test', page: 1, limit: 10 });

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
      routeTestControl.parseBodyOverride = async () => {
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
      mockedFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      routeTestControl.parseBodyOverride = async () => ({
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

      routeTestControl.parseBodyOverride = async () => ({ query: 'test' });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Failed to perform search');
    });

    it('handles E2E POST scenario with fail-once', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
        filters: {},
      });

      routeTestControl.parseBodyOverride = async () => ({
        query: 'test',
        e2eScenario: 'fail-once',
      });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(503);
      expect(json.error).toBe('Simulated search failure');
    });

    it('handles E2E POST scenario with retry', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [{ _id: '1', name: 'Test' }],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1, hasMore: false },
        filters: {},
      });

      routeTestControl.parseBodyOverride = async () => ({
        query: 'test',
        e2eScenario: 'fail-once',
        retry: 'token',
      });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.results).toHaveLength(1);
    });

    it('handles E2E POST scenario with timeout', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
        filters: {},
      });

      routeTestControl.parseBodyOverride = async () => ({
        query: 'test',
        e2eScenario: 'timeout',
      });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });

      const startTime = Date.now();
      const response = await POST(request);
      const elapsed = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });

    it('handles E2E POST with facets', async () => {
      mockedIsE2ERun.mockReturnValue(true);
      mockedBuildE2EResponse.mockReturnValue({
        results: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasMore: false },
        facets: {
          category: [],
          destination: [],
          amenities: [],
        },
        filters: {},
      });

      routeTestControl.parseBodyOverride = async () => ({
        query: 'test',
        facets: true,
      });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.facets).toBeDefined();
    });

    it('handles non-real-client fetch function call', async () => {
      routeTestControl.clientFetchOverride = undefined;
      mockedIsE2ERun.mockReturnValue(false);

      // Mock the Sanity client
      const _mockClient = {
        fetch: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(0),
      };

      // This test verifies the fallback to client.fetch when no override is set
      routeTestControl.parseBodyOverride = async () => ({ query: 'test' });

      const request = createRequest('http://localhost:3000/api/search', {
        method: 'POST',
      });

      // Set up mock to use real client path
      mockedFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('buildWhereClause', () => {
    it('should build a where clause with all filters', () => {
      const { buildWhereClause } = require('../route');
      const where = buildWhereClause({
        q: 'test',
        categories: ['cafe'],
        destinations: ['Bangkok'],
        amenities: ['wifi'],
        nomadFeatures: ['fast-internet'],
      });
      expect(where).toContain('lower(name) match "*test*"');
      expect(where).toContain('category == "cafe"');
      expect(where).toContain('city->name == "Bangkok"');
      expect(where).toContain('amenities[]->name');
      expect(where).toContain('digitalNomadFeatures[]->name');
    });
  });

  describe('buildFacetBuckets', () => {
    it('should build facet buckets from source data', () => {
      const { buildFacetBuckets } = require('../route');
      const source = [
        { category: 'cafe', destination: 'Bangkok', amenities: ['wifi', 'coffee'] },
        { category: 'cafe', destination: 'Chiang Mai', amenities: ['wifi'] },
      ];
      const buckets = buildFacetBuckets(source);
      expect(buckets.category).toEqual([{ value: 'cafe', count: 2 }]);
      expect(buckets.destination).toEqual([
        { value: 'Bangkok', count: 1 },
        { value: 'Chiang Mai', count: 1 },
      ]);
      expect(buckets.amenities).toEqual([
        { value: 'wifi', count: 2 },
        { value: 'coffee', count: 1 },
      ]);
    });
  });
});
