import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock external deps used in the route
jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    create: jest.fn(),
    getDocument: jest.fn(),
  },
}));
jest.mock('@/lib/sanity/user', () => ({ ensureSanityUser: jest.fn() }));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));

// Import after mocks to receive mocked versions
import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';
import { revalidateTag } from 'next/cache';

describe('API /api/comments', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET', () => {
    it('returns 400 when postId is missing', async () => {
      const req = new Request('http://localhost/api/comments');
      const res = await GET(req);
      expect(res.status).toBe(400);
      expect(client.fetch).not.toHaveBeenCalled();
    });

    it('returns approved comments for a post with pagination', async () => {
      (client.fetch as jest.Mock).mockResolvedValueOnce([
        { _id: 'c1', content: 'Great post', approved: true, user: { _id: 'u1', name: 'Alice' } },
        { _id: 'c2', content: 'Nice read', approved: true, user: { _id: 'u2', name: 'Bob' } },
      ]);

      const req = new Request('http://localhost/api/comments?postId=p1&page=1&limit=2');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.comments).toHaveLength(2);
      expect(client.fetch).toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('rejects unauthorized users', async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);
      const req = new Request('http://localhost/api/comments', {
        method: 'POST',
        body: JSON.stringify({ content: 'Hi', postId: 'p1' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toHaveProperty('error');
    });

    it('creates a comment and revalidates tag', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'user', name: 'User', email: 'u@example.com' } });
      (ensureSanityUser as jest.Mock).mockResolvedValueOnce({ _id: 'sanityUser1', _type: 'user' });
      (client.getDocument as jest.Mock).mockResolvedValueOnce({ _id: 'p1', slug: { current: 'post-slug' } });
      (client.create as jest.Mock).mockResolvedValueOnce({ _id: 'comment1', _type: 'comment' });

      const req = new Request('http://localhost/api/comments', {
        method: 'POST',
        body: JSON.stringify({ content: 'Great article!', postId: 'p1' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toMatchObject({ _id: 'comment1' });
      expect(revalidateTag).toHaveBeenCalledWith('post:post-slug');
    });
  });
});
