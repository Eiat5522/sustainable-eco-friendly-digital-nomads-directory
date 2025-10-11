/**
 * Jest Test Suite for Blog API Route
 * Tests covering:
 * 1. GET /api/blog - Fetch all published blog posts
 * 2. Error handling for database failures
 */

import { jest, beforeAll } from '@jest/globals';

import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/server';

// Add Redis handler for MSW - Upstash Redis uses a specific response format
// All commands return immediately to avoid hanging
beforeAll(() => {
  server.use(
    http.post('http://localhost:8079/pipeline', async ({ request }) => {
      try {
        const body = await request.json();
        // Upstash Redis expects responses in format: [{ result: value }, ...]
        if (Array.isArray(body)) {
          return HttpResponse.json(body.map((cmd: any) => {
            const [command] = cmd;
            // GET returns null (cache miss), SET returns 'OK'
            return { result: command === 'set' ? 'OK' : null };
          }));
        }
      } catch (e) {
        // If parsing fails, return a default response
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

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

import { GET } from '@/app/api/blog/route';
import { client } from '@/lib/sanity/client';

describe('Blog API - GET /api/blog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Requests', () => {
    it('should return all published blog posts', async () => {
      const mockPosts = [
        { _id: '1', title: 'Test Post 1', publishedAt: '2024-01-01' },
        { _id: '2', title: 'Test Post 2', publishedAt: '2024-01-02' }
      ];
      (client.fetch as jest.Mock).mockResolvedValue(mockPosts);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPosts);
      expect(client.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array when no posts exist', async () => {
      (client.fetch as jest.Mock).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database fetch failure', async () => {
      (client.fetch as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await GET();

      expect(response.status).toBe(500);
      expect(client.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query Validation', () => {
    it('should use correct GROQ query structure', async () => {
      (client.fetch as jest.Mock).mockResolvedValue([]);

      await GET();

      const query = (client.fetch as jest.Mock).mock.calls[0][0];
      expect(query).toContain('_type == "blogPost"');
      expect(query).toContain('order(publishedAt desc');
      expect(query).toContain('!(_id in path(\'drafts.**\'))');
      expect(query).toContain('defined(publishedAt)');
      expect(query).toContain('publishedAt <= now()');
    });
  });
});
