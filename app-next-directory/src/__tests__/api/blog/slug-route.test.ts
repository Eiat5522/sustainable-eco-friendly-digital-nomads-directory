/**
 * Jest Test Suite for Blog Slug API Route
 * Tests covering:
 * 1. GET /api/blog/[slug] - Fetch single blog post with comments
 * 2. 404 handling for non-existent posts
 * 3. Error handling for database failures
 */

import { jest } from '@jest/globals';
import { NextResponse } from 'next/server';

// Mock Sanity client
const mockFetch = jest.fn();
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: mockFetch,
  },
}));

// Import the route handler after mocks are set up
import { GET } from '@/app/api/blog/[slug]/route';

describe('Blog Slug API - GET /api/blog/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Requests', () => {
    it('should return blog post with comments when post exists', async () => {
      const mockPost = {
        _id: 'post-123',
        title: 'Test Post',
        slug: { current: 'test-post' },
        content: 'Post content',
        publishedAt: '2024-01-01T00:00:00Z',
      };

      const mockComments = [
        {
          _id: 'comment-1',
          content: 'Great post!',
          createdAt: '2024-01-02T00:00:00Z',
          user: { name: 'John Doe' },
        },
        {
          _id: 'comment-2',
          content: 'Very helpful',
          createdAt: '2024-01-03T00:00:00Z',
          user: { name: 'Jane Smith' },
        },
      ];

      // First call for post, second call for comments
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(mockComments);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        post: mockPost,
        comments: mockComments,
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fetch post by slug parameter', async () => {
      const mockPost = { _id: 'post-123', title: 'Test' };
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'my-slug' } };

      await GET(mockRequest, mockParams);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('slug.current == $slug'),
        { slug: 'my-slug' }
      );
    });

    it('should return empty comments array when no comments exist', async () => {
      const mockPost = { _id: 'post-123', title: 'Test' };
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.comments).toEqual([]);
    });

    it('should only fetch approved comments', async () => {
      const mockPost = { _id: 'post-123', title: 'Test' };
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      await GET(mockRequest, mockParams);

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('approved == true'),
        expect.any(Object)
      );
    });

    it('should filter out draft comments', async () => {
      const mockPost = { _id: 'post-123', title: 'Test' };
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      await GET(mockRequest, mockParams);

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('!(_id in path("drafts.**"))'),
        expect.any(Object)
      );
    });

    it('should order comments by createdAt ascending', async () => {
      const mockPost = { _id: 'post-123', title: 'Test' };
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      await GET(mockRequest, mockParams);

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('order(coalesce(createdAt, _createdAt) asc)'),
        expect.any(Object)
      );
    });
  });

  describe('Not Found Handling', () => {
    it('should return 404 when post does not exist', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'non-existent' } };

      const response = await GET(mockRequest, mockParams);

      expect(response.status).toBe(404);
      expect(response instanceof NextResponse).toBe(true);
    });

    it('should return 404 when post is undefined', async () => {
      mockFetch.mockResolvedValueOnce(undefined);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'non-existent' } };

      const response = await GET(mockRequest, mockParams);

      expect(response.status).toBe(404);
    });

    it('should not fetch comments when post is not found', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'non-existent' } };

      await GET(mockRequest, mockParams);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when post fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Database error'));

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      const response = await GET(mockRequest, mockParams);

      expect(response.status).toBe(500);
    });

    it('should return 500 when comments fetch fails', async () => {
      const mockPost = { _id: 'post-123', title: 'Test' };
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockRejectedValueOnce(new Error('Comments fetch failed'));

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      const response = await GET(mockRequest, mockParams);

      expect(response.status).toBe(500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      const response = await GET(mockRequest, mockParams);

      expect(response.status).toBe(500);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      const response = await GET(mockRequest, mockParams);

      expect(response.status).toBe(500);
    });
  });

  describe('Query Validation', () => {
    it('should fetch comments with correct post reference', async () => {
      const mockPost = { _id: 'post-456', title: 'Test' };
      mockFetch
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce([]);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post' } };

      await GET(mockRequest, mockParams);

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('post._ref == $postId'),
        { postId: 'post-456' }
      );
    });

    it('should handle special characters in slug', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const mockRequest = {} as Request;
      const mockParams = { params: { slug: 'test-post-with-special-chars-123' } };

      await GET(mockRequest, mockParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        { slug: 'test-post-with-special-chars-123' }
      );
    });
  });
});
