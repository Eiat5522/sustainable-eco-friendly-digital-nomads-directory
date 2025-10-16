/**
 * Jest Test Suite for Blog [slug] API Route
 * Tests covering:
 * 1. GET /api/blog/[slug] - Fetch single blog post by slug
 * 2. PUT /api/blog/[slug] - Update view count
 * 3. Error handling
 */

import { jest } from '@jest/globals';
import { GET, PUT } from './route';
import { client as sanityClient } from '@/lib/sanity/client';

// Mock Sanity client
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

// Mock DTO transformer
jest.mock('@/lib/dto-transformer', () => ({
  transformToBlogDetailDTO: jest.fn((post) => ({
    ...post,
    readingTime: post.readingTime || 5,
    body: post.body || [],
    relatedPosts: post.relatedPosts || [],
  })),
}));

describe('Blog [slug] API', () => {
  let mockedFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch = sanityClient.fetch as jest.Mock;
  });

  describe('GET /api/blog/[slug]', () => {
    describe('Successful Requests', () => {
      it('should return blog post by slug', async () => {
        const mockPost = {
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
        mockedFetch.mockResolvedValueOnce(mockPost);

        const request = new Request('http://localhost/api/blog/sustainable-living-guide');
        const params = Promise.resolve({ slug: 'sustainable-living-guide' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.post.title).toBe('Sustainable Living Guide');
        expect(data.data.post.slug).toBe('sustainable-living-guide');
        expect(data.data.meta).toBeDefined();
        expect(data.data.meta.readingTime).toBe(5);
        expect(mockedFetch).toHaveBeenCalledTimes(1);
      });

      it('should include related posts in response', async () => {
        const mockPost = {
          _id: '1',
          title: 'Test Post',
          slug: 'test-post',
          publishedAt: '2024-01-01',
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
        mockedFetch.mockResolvedValueOnce(mockPost);

        const request = new Request('http://localhost/api/blog/test-post');
        const params = Promise.resolve({ slug: 'test-post' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(data.data.relatedPosts).toBeDefined();
        expect(Array.isArray(data.data.relatedPosts)).toBe(true);
      });

      it('should use correct GROQ query with slug parameter', async () => {
        mockedFetch.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/blog/test-slug');
        const params = Promise.resolve({ slug: 'test-slug' });
        await GET(request, { params });

        const query = mockedFetch.mock.calls[0][0];
        const queryParams = mockedFetch.mock.calls[0][1];

        expect(query).toContain('_type == "blogPost"');
        expect(query).toContain('slug.current == $slug');
        expect(queryParams).toEqual({ slug: 'test-slug' });
      });
    });

    describe('Error Handling', () => {
      it('should return 404 when blog post not found', async () => {
        mockedFetch.mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/blog/non-existent');
        const params = Promise.resolve({ slug: 'non-existent' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toContain('Blog post');
      });

      it('should return 400 when slug is missing', async () => {
        const request = new Request('http://localhost/api/blog/');
        const params = Promise.resolve({ slug: '' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Blog post slug is required');
        expect(mockedFetch).not.toHaveBeenCalled();
      });

      it('should return 500 on database fetch failure', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('Database error'));

        const request = new Request('http://localhost/api/blog/test-slug');
        const params = Promise.resolve({ slug: 'test-slug' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch blog post');
      });

      it('should return 503 on CMS connection failure', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('fetch failed'));

        const request = new Request('http://localhost/api/blog/test-slug');
        const params = Promise.resolve({ slug: 'test-slug' });
        const response = await GET(request, { params });
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error).toBe('Failed to connect to CMS. Please try again later.');
      });

      it('should return 400 on invalid slug parameter', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('Invalid parameter'));

        const request = new Request('http://localhost/api/blog/test-slug');
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
        mockedFetch.mockResolvedValueOnce(mockPost);

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
      });

      it('should increment view count multiple times', async () => {
        const mockPost = {
          _id: 'post-456',
          slug: 'another-post',
        };
        mockedFetch.mockResolvedValue(mockPost);

        const request1 = new Request('http://localhost/api/blog/another-post', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const params = Promise.resolve({ slug: 'another-post' });
        
        const response1 = await PUT(request1, { params });
        const data1 = await response1.json();
        expect(data1.data.viewCount).toBe(1);

        const request2 = new Request('http://localhost/api/blog/another-post', {
          method: 'PUT',
          body: JSON.stringify({ action: 'increment_view' }),
        });
        const response2 = await PUT(request2, { params });
        const data2 = await response2.json();
        expect(data2.data.viewCount).toBe(2);
      });

      it('should return 404 when post not found for view tracking', async () => {
        mockedFetch.mockResolvedValueOnce(null);

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
        mockedFetch.mockRejectedValueOnce(new Error('Database error'));

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
    });
  });
});
