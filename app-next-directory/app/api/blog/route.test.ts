/**
 * Jest Test Suite for Blog API Route
 * Tests covering:
 * 1. GET /api/blog - Fetch all published blog posts
 * 2. Error handling for database failures
 * 3. Pagination and query filtering
 */

describe('Blog API - GET /api/blog', () => {
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the sanity client and DTO transformer so we don't mutate exported testControl
const fetchMock = jest.fn();
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the sanity client and DTO transformer so we don't mutate exported testControl
const fetchMock = jest.fn();
const transformMock = jest.fn((post) => ({ id: post._id, title: post.title }));

jest.mock('@/lib/sanity/client', () => ({ client: { fetch: (...args: any[]) => fetchMock(...args) } }));
jest.mock('@/lib/dto-transformer', () => ({ transformToBlogSummaryDTO: (...args: any[]) => transformMock(...args) }));

let GET: any;
let routeTestControl: any;

describe('Blog API - GET /api/blog', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    transformMock.mockClear();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ GET, testControl: routeTestControl } = require('./route'));
  });

  afterEach(() => {
    if (routeTestControl) {
      // no-op: module-level mocks cover client/transformer; clear any internal overrides if added in tests
    }
  });

  describe('Successful Requests', () => {
    it('returns paginated blog posts', async () => {
      const mockPosts = [
        { _id: '1', title: 'Test Post 1', publishedAt: '2024-01-01', slug: { current: 'test-post-1' } },
        { _id: '2', title: 'Test Post 2', publishedAt: '2024-01-02', slug: { current: 'test-post-2' } },
      ];
      fetchMock.mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(2);

      const request = new Request('http://localhost/api/blog?page=1&limit=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.posts.length).toBe(2);
      expect(data.data.pagination.totalCount).toBe(2);
      expect(data.data.pagination.page).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(transformMock).toHaveBeenCalledTimes(2);
    });

    it('returns an empty array when no posts exist', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.posts).toEqual([]);
      expect(data.data.pagination.totalCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on fetch failure', async () => {
      fetchMock.mockRejectedValue(new Error('DB Error'));

      const request = new Request('http://localhost/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch blog posts');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Query Validation', () => {
    it('uses the correct GROQ queries for general requests', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog');
      await GET(request);

      const postsQuery = fetchMock.mock.calls[0][0] as string;
      const countQuery = fetchMock.mock.calls[1][0] as string;

      expect(postsQuery).toContain('_type == "blogPost"');
      expect(postsQuery).toContain('order(publishedAt desc)');
      expect(countQuery).toContain('count(*[_type == "blogPost" && defined(slug)])');
    });

    it('includes tag filter in query when tag is provided', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog?tag=tech');
      await GET(request);

      const postsQuery = fetchMock.mock.calls[0][0] as string;
      expect(postsQuery).toContain('"tech" in tags');
    });

    it('includes search filter in query when search term is provided', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog?search=Next.js');
      await GET(request);

      const postsQuery = fetchMock.mock.calls[0][0] as string;
      expect(postsQuery).toContain('title match "*Next.js*"');
    });
  });
});

jest.mock('@/lib/sanity/client', () => ({ client: { fetch: (...args: any[]) => fetchMock(...args) } }));
jest.mock('@/lib/dto-transformer', () => ({ transformToBlogSummaryDTO: (...args: any[]) => transformMock(...args) }));

let GET: any;
let routeTestControl: any;

describe('Blog API - GET /api/blog', () => {
  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    transformMock.mockClear();
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ GET, testControl: routeTestControl } = require('./route'));
  });

  afterEach(() => {
    if (routeTestControl) {
      // no-op: module-level mocks cover client/transformer; clear any internal overrides if added in tests
    }
  });

    it('returns paginated blog posts', async () => {
      const mockPosts = [
        { _id: '1', title: 'Test Post 1', publishedAt: '2024-01-01', slug: { current: 'test-post-1' } },
        { _id: '2', title: 'Test Post 2', publishedAt: '2024-01-02', slug: { current: 'test-post-2' } },
      ];
      fetchMock.mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(2);

      const request = new Request('http://localhost/api/blog?page=1&limit=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.posts.length).toBe(2);
      expect(data.data.pagination.totalCount).toBe(2);
      expect(data.data.pagination.page).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(transformMock).toHaveBeenCalledTimes(2);
    });

    it('returns an empty array when no posts exist', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.posts).toEqual([]);
      expect(data.data.pagination.totalCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on fetch failure', async () => {
      fetchMock.mockRejectedValue(new Error('DB Error'));

      const request = new Request('http://localhost/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch blog posts');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Query Validation', () => {
    it('uses the correct GROQ queries for general requests', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog');
      await GET(request);

      const postsQuery = fetchMock.mock.calls[0][0] as string;
      const countQuery = fetchMock.mock.calls[1][0] as string;

      expect(postsQuery).toContain('_type == "blogPost"');
      expect(postsQuery).toContain('order(publishedAt desc)');
      expect(countQuery).toContain('count(*[_type == "blogPost" && defined(slug)])');
    });

    it('includes tag filter in query when tag is provided', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog?tag=tech');
      await GET(request);

      const postsQuery = fetchMock.mock.calls[0][0] as string;
      expect(postsQuery).toContain('"tech" in tags');
    });

    it('includes search filter in query when search term is provided', async () => {
      fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog?search=Next.js');
      await GET(request);

      const postsQuery = fetchMock.mock.calls[0][0] as string;
      expect(postsQuery).toContain('title match "*Next.js*"');
    });
  });
});
