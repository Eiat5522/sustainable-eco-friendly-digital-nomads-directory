/**
 * Jest Test Suite for Blog API Route
 * Tests covering:
 * 1. GET /api/blog - Fetch all published blog posts
 * 2. Error handling for database failures
 * 3. Pagination
 */

import { jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/server';
import { GET } from './route'; // Import GET from the same directory
import { client } from '@/lib/sanity/client';

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('Blog API - GET /api/blog', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = client.fetch as jest.Mock;

    // Mock server handlers if needed, for now we focus on Sanity mock
    server.use(
      http.post('http://localhost:8079/pipeline', async ({ request }) => {
        try {
          const body = await request.json();
          if (Array.isArray(body)) {
            return HttpResponse.json(body.map((cmd: any) => {
              const [command] = cmd;
              return { result: command === 'set' ? 'OK' : null };
            }));
          }
        } catch (e) {
          // Parsing failed
        }
        return HttpResponse.json([{ result: null }]);
      }),
      http.post('http://localhost:8079/*', () => {
        return HttpResponse.json({ result: 'OK' });
      }),
      http.options('http://localhost:8079/*', () => {
        return new HttpResponse(null, { status: 200 });
      })
    );
  });

  describe('Successful Requests', () => {
    it('should return paginated blog posts', async () => {
      const mockPosts = [
        { _id: '1', title: 'Test Post 1', publishedAt: '2024-01-01', slug: { current: 'test-post-1' } },
        { _id: '2', title: 'Test Post 2', publishedAt: '2024-01-02', slug: { current: 'test-post-2' } }
      ];
      mockedFetch.mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(2);

      const request = new Request('http://localhost/api/blog?page=1&limit=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.posts.length).toBe(2);
      expect(data.data.pagination.totalCount).toBe(2);
      expect(data.data.pagination.page).toBe(1);
      expect(mockedFetch).toHaveBeenCalledTimes(2);
    });

    it('should return an empty array when no posts exist', async () => {
      mockedFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.posts).toEqual([]);
      expect(data.data.pagination.totalCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database fetch failure', async () => {
      mockedFetch.mockRejectedValue(new Error('DB Error'));

      const request = new Request('http://localhost/api/blog');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch blog posts');
      expect(mockedFetch).toHaveBeenCalledTimes(2); // It will try to fetch posts and count
    });
  });

  describe('Query Validation', () => {
    it('should use correct GROQ query structure for general requests', async () => {
      mockedFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

      const request = new Request('http://localhost/api/blog');
      await GET(request);

      const postsQuery = mockedFetch.mock.calls[0][0];
      const countQuery = mockedFetch.mock.calls[1][0];

      expect(postsQuery).toContain('_type == "blogPost"');
      expect(postsQuery).toContain('order(publishedAt desc)');
      expect(countQuery).toContain('count(*[_type == "blogPost" && defined(slug)])');
    });

    it('should include tag filter in query when tag is provided', async () => {
        mockedFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

        const request = new Request('http://localhost/api/blog?tag=tech');
        await GET(request);

        const postsQuery = mockedFetch.mock.calls[0][0];
        expect(postsQuery).toContain('"tech" in tags');
    });

    it('should include search filter in query when search term is provided', async () => {
        mockedFetch.mockResolvedValueOnce([]).mockResolvedValueOnce(0);

        const request = new Request('http://localhost/api/blog?search=Next.js');
        await GET(request);

        const postsQuery = mockedFetch.mock.calls[0][0];
        expect(postsQuery).toContain('title match "*Next.js*"');
    });
  });
});
