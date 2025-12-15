/**
 * Strongly-typed Jest Test Suite for Blog [slug] API Route
 * Replaces previous tests with test-only types and typed mocks.
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// We'll mock the modules the route imports so tests don't need to mutate exported _testControl
const fetchMock = jest.fn() as jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
const transformMock = jest.fn() as jest.MockedFunction<(p: unknown) => unknown>;
const trackViewCountMock = jest.fn() as jest.MockedFunction<(id: string) => Promise<number>>;
const persistentIncrementMock = jest.fn() as jest.MockedFunction<(id: string) => Promise<number>>;

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    performance: jest.fn(),
  },
  structuredLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    performance: jest.fn(),
  },
}));

jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));
jest.mock('@/lib/dto-transformer', () => ({
  transformToBlogDetailDTO: (...args: unknown[]) => transformMock(...args),
}));
jest.mock('@/lib/viewCountPersistence', () => ({
  incrementViewCount: (...args: unknown[]) => persistentIncrementMock(...args),
}));

type RouteModule = typeof import('../route');
let GET: RouteModule['GET'];
let PUT: RouteModule['PUT'];
let routeTestControl: unknown;

// Test-only types
type BlogPost = {
  _id: string;
  title?: string;
  slug?: string;
  publishedAt?: string;
  excerpt?: string;
  body?: unknown[];
  tags?: string[];
  authorName?: string;
  readingTime?: number;
  relatedPosts?: BlogPost[];
  _createdAt?: string;
  _updatedAt?: string;
};

type SanityFetchFn = (...args: unknown[]) => Promise<BlogPost | BlogPost[] | null>;

// (mocks defined above and used by module mocks)

describe('Blog [slug] API', () => {
  beforeEach(() => {
    // Ensure a fresh module instance so our module mocks are applied
    jest.resetModules();
    jest.clearAllMocks();
    fetchMock.mockReset();
    transformMock.mockReset();
    trackViewCountMock.mockReset();
    persistentIncrementMock.mockReset();
    persistentIncrementMock.mockRejectedValue(new Error('db unavailable'));

    // Load the route after mocks are in place so it picks up the mocked client and transformer

    const route = require('./route');
    GET = route.GET;
    PUT = route.PUT;
    routeTestControl = route._testControl;

    // trackViewCount is internal; set the override on the required module's _testControl
    (routeTestControl as { trackViewCountOverride?: typeof trackViewCountMock; resetViewCounts: () => void; resetFallbackMetrics: () => void }).trackViewCountOverride = trackViewCountMock;
    (routeTestControl as { resetViewCounts: () => void }).resetViewCounts();
    (routeTestControl as { resetFallbackMetrics: () => void }).resetFallbackMetrics();
  });

  afterEach(() => {
    if (routeTestControl) {
      routeTestControl.trackViewCountOverride = undefined;
      routeTestControl.resetViewCounts();
      routeTestControl.resetFallbackMetrics();
    }
  });

  describe('GET /api/blog/[slug]', () => {
    describe('Successful Requests', () => {
      it('should return blog post by slug', async () => {
        const mockPost: BlogPost = {
          _id: '1',
          title: 'Sustainable Living Guide',
          slug: 'sustainable-living-guide',
          publishedAt: '2024-01-01',
          excerpt: 'A guide to sustainable living',
          body: [{ _type: 'block', children: [{ text: 'Content' }] }],
          tags: ['sustainability', 'lifestyle'],
          authorName: 'John Doe',
          readingTime: 5,
          relatedPosts: [],
          _createdAt: '2024-01-01',
          _updatedAt: '2024-01-02',
        };
        fetchMock.mockResolvedValueOnce(mockPost);
        transformMock.mockReturnValueOnce({
          ...mockPost,
          readingTime: 5,
          body: mockPost.body,
          relatedPosts: [],
          publishedAt: mockPost.publishedAt,
        });

        // Use a real Request so route handlers that read headers/body behave correctly
        const request = new Request('http://localhost/api/blog/sustainable-living-guide');
        const params = Promise.resolve({ slug: 'sustainable-living-guide' });
        const response = await GET(request as Partial<NextRequest> as NextRequest, { params });
        const data = await response.json();

        // Debug: log response if not 200
        if (response.status !== 200) {
          structuredLogger.debug('Response status:', { status: response.status });
          structuredLogger.debug('Response data:', { data });
        }

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.post.title).toBe('Sustainable Living Guide');
        expect(data.data.post.slug).toBe('sustainable-living-guide');
        expect(data.data.meta).toBeDefined();
        expect(data.data.meta.readingTime).toBe(5);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });

      it('should include related posts in response', async () => {
        const mockPost: BlogPost = {
          _id: '1',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: '2024-01-01',
          body: [],
          relatedPosts: [
            {
              _id: '2',
              title: 'Related Post 1',
              slug: 'related-post-1',
              publishedAt: '2024-01-02',
            },
          ],
          _updatedAt: '2024-01-02',
        };
        fetchMock.mockResolvedValueOnce(mockPost);
        transformMock.mockReturnValueOnce({
          ...mockPost,
          readingTime: 5,
          relatedPosts: mockPost.relatedPosts,
        });

        const request = new Request('http://localhost/api/blog/test-post');
        const params = Promise.resolve({ slug: 'test-post' });
        const response = await GET(request as Partial<NextRequest> as NextRequest, { params });
        const data = await response.json();

        /* End of new strong-typed test file */
        expect(data.data.relatedPosts).toBeDefined();
        expect(Array.isArray(data.data.relatedPosts)).toBe(true);
      });

      it('should normalize optional fields when transformer omits them', async () => {
        const mockPost: BlogPost = {
          _id: '1',
          title: 'Test Post Without Extras',
          slug: 'test-post',
          publishedAt: undefined,
          body: undefined,
          relatedPosts: undefined,
          _updatedAt: '2024-02-01T00:00:00.000Z',
        };
        fetchMock.mockResolvedValueOnce(mockPost);
        transformMock.mockReturnValueOnce({
          _id: mockPost._id,
          title: mockPost.title,
          slug: mockPost.slug,
          body: undefined,
          relatedPosts: undefined,
          publishedAt: undefined,
          readingTime: undefined,
        });

        const request = new Request('http://localhost/api/blog/test-post');
        const params = Promise.resolve({ slug: 'test-post' });
        const response = await GET(request as Partial<NextRequest> as NextRequest, { params });
        const data = await response.json();

        expect(data.data.relatedPosts).toEqual([]);
        expect(data.data.meta.readingTime).toBeNull();
        expect(data.data.meta.publishedDate).toBeNull();
        expect(data.data.meta.wordCount).toBe(0);
        expect(data.data.meta.lastModified).toBe('2024-02-01T00:00:00.000Z');
      });

      it('should use correct GROQ query with slug parameter', async () => {
        fetchMock.mockResolvedValueOnce(null);

        const request = {} as Partial<NextRequest> as NextRequest;
        const params = Promise.resolve({ slug: 'test-slug' });
        await GET(request, { params });

        const query = fetchMock.mock.calls[0][0];
        const queryParams = fetchMock.mock.calls[0][1];

        expect(query).toContain('_type == "blogPost"');
        expect(query).toContain('slug.current == $slug');
        expect(queryParams).toEqual({ slug: 'test-slug' });
      });
    });

    describe('Error Handling', () => {
      it('should return 404 when blog post not found', async () => {
        fetchMock.mockResolvedValueOnce(null);

        const request = {} as Partial<NextRequest> as NextRequest;
        const params = Promise.resolve({ slug: 'non-existent' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Blog post');
      });

      it('should return 400 when slug is missing', async () => {
        const request = {} as Partial<NextRequest> as NextRequest;
        const params = Promise.resolve({ slug: '' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Blog post slug is required');
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('should return 500 on database fetch failure', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Database error'));

        const request = {} as Partial<NextRequest> as NextRequest;
        const params = Promise.resolve({ slug: 'test-slug' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch blog post');
      });

      it('should return 503 on CMS connection failure', async () => {
        fetchMock.mockRejectedValueOnce(new Error('fetch failed'));

        const request = {} as Partial<NextRequest> as NextRequest;
        const params = Promise.resolve({ slug: 'test-slug' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error).toBe('Failed to connect to CMS. Please try again later.');
      });

      it('should return 400 on invalid slug parameter', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Invalid parameter'));

        const request = {} as Partial<NextRequest> as NextRequest;
        const params = Promise.resolve({ slug: 'test-slug' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid blog post slug');
      });
    });
  });

  describe('PUT /api/blog/[slug]', () => {
    describe('View Count Tracking', () => {
      it('should increment view count for valid post', async () => {
        const mockPost = {
          _id: 'post-123',
          slug: 'test-post',
        };
        fetchMock.mockResolvedValueOnce(mockPost);
        trackViewCountMock.mockResolvedValueOnce(1);

        const request = new Request('http://localhost/api/blog/test-post', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const params = Promise.resolve({ slug: 'test-post' });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.viewCount).toBe(1);
        expect(data.message).toBe('View count updated successfully');
        expect(trackViewCountMock).toHaveBeenCalledWith('post-123');
      });

      it('should increment view count multiple times', async () => {
        const mockPost = {
          _id: 'post-456',
          slug: 'another-post',
        };
        fetchMock.mockResolvedValue(mockPost);
        trackViewCountMock.mockResolvedValueOnce(1);

        const request1 = new Request('http://localhost/api/blog/another-post', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const params = Promise.resolve({ slug: 'another-post' });

        const response1 = await PUT(request1, { params });
        const data1 = await response1.json();
        expect(data1.data.viewCount).toBe(1);

        trackViewCountMock.mockResolvedValueOnce(2);
        const request2 = new Request('http://localhost/api/blog/another-post', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const response2 = await PUT(request2, { params });
        const data2 = await response2.json();
        expect(data2.data.viewCount).toBe(2);
      });

      it('should return 404 when post not found for view tracking', async () => {
        fetchMock.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/blog/non-existent', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const params = Promise.resolve({ slug: 'non-existent' });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
      });

      it('should return 400 for invalid action', async () => {
        const request = new Request('http://localhost/api/blog/test-post', {
          method: 'PUT',
          body: JSON.stringify({ action: 'invalid_action' }),
        });
        const params = Promise.resolve({ slug: 'test-post' });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid action');
      });

      it('should return 500 on error during view count update', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Database error'));

        const request = new Request('http://localhost/api/blog/test-post', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const params = Promise.resolve({ slug: 'test-post' });
        const response = await PUT(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to update blog post');
      });

      it('should fallback to in-memory when database returns invalid result', async () => {
        routeTestControl.trackViewCountOverride = undefined;
        routeTestControl.resetViewCounts();
        routeTestControl.resetFallbackMetrics();

        fetchMock.mockResolvedValue({
          _id: 'post-fallback',
          slug: 'fallback',
        });

        const params = Promise.resolve({ slug: 'fallback' });

        // First increment - database mock returns { value: null } which is invalid
        // This triggers the error handler and falls back to in-memory tracking
        const request1 = new Request('http://localhost/api/blog/fallback', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const response1 = await PUT(request1, { params });
        const data1 = await response1.json();
        expect(data1.data.viewCount).toBe(1);

        // Second increment - continues using in-memory fallback
        // In-memory tracking maintains state, so count increments correctly
        const request2 = new Request('http://localhost/api/blog/fallback', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const response2 = await PUT(request2, { params });
        const data2 = await response2.json();
        // In-memory fallback maintains state correctly
        expect(data2.data.viewCount).toBe(2);
      });

      it('tracks fallback cache metrics and enforces eviction policy', async () => {
        routeTestControl.trackViewCountOverride = undefined;
        routeTestControl.resetViewCounts();
        routeTestControl.resetFallbackMetrics();

        fetchMock.mockImplementation(async (_query: string, params?: Record<string, any>) => {
          const slug = (params?.slug ?? 'unknown') as string;
          return { _id: `post-${slug}`, slug };
        });

        const { maxSize } = routeTestControl.getFallbackMetrics();

        const createRequest = (slug: string) =>
          new Request(`http://localhost/api/blog/${slug}`, {
            method: 'PUT',
            body: JSON.stringify({ action: 'increment_view' }),
          });

        const createParams = (slug: string) => Promise.resolve({ slug });

        for (let index = 0; index < maxSize + 5; index += 1) {
          const slug = `slug-${index}`;
          await PUT(createRequest(slug), { params: createParams(slug) });
          if (index < 3) {
            await PUT(createRequest(slug), { params: createParams(slug) });
          }
        }

        const recentSlug = `slug-${maxSize + 4}`;
        await PUT(createRequest(recentSlug), { params: createParams(recentSlug) });

        const metrics = routeTestControl.getFallbackMetrics();

        expect(metrics.totalFallbacks).toBeGreaterThanOrEqual(maxSize + 7);
        expect(metrics.currentSize).toBeLessThanOrEqual(metrics.maxSize);
        expect(metrics.evictions).toBeGreaterThan(0);
        expect(metrics.cacheHits).toBeGreaterThan(0);
      });
    });
  });
});
