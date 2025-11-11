/**
 * Search API Route Tests - MSW Version
 * 
 * This version uses MSW to intercept Sanity API calls instead of mocking the client.
 * The real Sanity client makes requests to https://test-project.api.sanity.io
 * which are intercepted by MSW handlers defined in src/mocks/sanity-handlers.ts
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

const mockedIsE2ERun = jest.fn();
const mockedBuildE2EResponse = jest.fn();

// Mock e2e fixture utilities but NOT the Sanity client
jest.mock('@/data/e2e/discovery-fixtures', () => ({ 
  isE2ERun: () => mockedIsE2ERun(), 
  buildE2ESearchResponse: (...args: any[]) => mockedBuildE2EResponse(...args) 
}));

const createRequest = (input: ConstructorParameters<typeof NextRequest>[0], init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(input, init);

let GET: any;
let POST: any;

describe('/api/search (MSW version)', () => {
  beforeEach(async () => {
    jest.resetModules();
    mockedIsE2ERun.mockReset();
    mockedBuildE2EResponse.mockReset();
    mockedIsE2ERun.mockReturnValue(false);
    
    // Enable MSW mode for Sanity client
    process.env.SANITY_FETCH_MODE = 'msw';
    
    // Import the route - this will use the real Sanity client with fetch
    ({ GET, POST } = await import('../route'));
  });

  afterEach(() => {
    delete process.env.SANITY_FETCH_MODE;
  });

  describe('GET - with MSW', () => {
    it('returns search results from Sanity via MSW', async () => {
      const request = createRequest('http://localhost:3000/api/search?q=test');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.results).toBeInstanceOf(Array);
      expect(json.data.pagination).toBeDefined();
    }, 10000);

    it('handles pagination parameters', async () => {
      const request = createRequest('http://localhost:3000/api/search?page=2&limit=20');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.pagination.page).toBe(2);
      expect(json.data.pagination.limit).toBe(20);
    });

    it('handles category filters', async () => {
      const request = createRequest('http://localhost:3000/api/search?category=cafe&category=coworking');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.filters.category).toEqual(['cafe', 'coworking']);
    });
  });
});
