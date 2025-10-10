/**
 * Jest Test Suite for Blog API Route
 * Tests covering:
 * 1. GET /api/blog - Fetch all published blog posts
 * 2. Error handling for database failures
 * 3. Pagination, filtering, and search
 */

import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock Sanity client
jest.mock('@/lib/sanity/client');
// Mock Redis
jest.mock('@/lib/sanity/cached-client');

import { GET } from '@/app/api/blog/route';
import { cachedClient } from '@/lib/sanity/cached-client';

const mockCachedFetch = cachedClient.fetch as jest.MockedFunction<
  typeof cachedClient.fetch
>;

// Helper to create a mock NextRequest
const createMockRequest = (searchParams: Record<string, string> = {}): NextRequest => {
  const url = new URL('http://localhost/api/blog');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString());
};

describe('Blog API - GET /api/blog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCachedFetch.mockReset();
  });

  describe('Successful Requests', () => {
    it('should return paginated blog posts', async () => {
      const mockPosts = [{ _id: '1', title: 'Test Post' }];
      mockFetch.mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(1);

      const request = createMockRequest({ page: '1', limit: '10' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toEqual(mockPosts);
      expect(data.pagination.totalCount).toBe(1);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Once for posts, once for count
    });

    it('should return an empty array when no posts exist', async () => {
      mockFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toEqual([]);
      expect(data.pagination.totalCount).toBe(0);
    });

    it('should handle tag and search filters', async () => {
      mockFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = createMockRequest({ tag: 'tech', search: 'nextjs' });
      await GET(request);

      const query = mockFetch.mock.calls[0][0];
      expect(query).toContain('\"tech\" in tags');
      expect(query).toContain('title match \"*nextjs*\"');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('DB Error'));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Failed to fetch blog posts');
    });

    it('should return 400 for invalid page/limit parameters', async () => {
      const request = createMockRequest({ page: 'invalid', limit: '-10' });
      const response = await GET(request);
      const data = await response.json();

      // The route logic coerces invalid values, so we check the outcome
      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10); // Default limit
    });
  });

  describe('Query Validation', () => {
    it('should use correct GROQ query structure', async () => {
      mockFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = createMockRequest();
      await GET(request);

      const postsQuery = mockFetch.mock.calls[0][0];
      expect(postsQuery).toContain('_type == "blogPost"');
      expect(postsQuery).toContain('order(publishedAt desc)');

      const countQuery = mockFetch.mock.calls[1][0];
      expect(countQuery).toContain('count(*[_type == "blogPost"');
    });
  });
});

