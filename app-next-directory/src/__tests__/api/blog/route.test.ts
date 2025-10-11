/**
 * Jest Test Suite for Blog API Route
 * Tests covering:
 * 1. GET /api/blog - Fetch all published blog posts
 * 2. Error handling for database failures
 */

import { jest } from '@jest/globals';

import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/server';

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

describe('Blog API - GET /api/blog', () => {
  let GET: any;
  let client: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Re-add Redis handlers after reset
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
    
    // Re-import modules after reset to get fresh instances
    const routeModule = await import('@/app/api/blog/route');
    GET = routeModule.GET;
    
    const clientModule = await import('@/lib/sanity/client');
    client = clientModule.client;
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
