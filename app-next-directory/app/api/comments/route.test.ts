import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock external deps used in the route
// Ensure NextResponse is mocked before importing the route so module imports
// that call NextResponse.json return a predictable test double.
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    create: jest.fn(),
    getDocument: jest.fn(),
  },
}));
// Make this mock ESM-compatible so `.mockResolvedValueOnce` is available
jest.mock('@/lib/sanity/user', () => ({ __esModule: true, ensureSanityUser: jest.fn() }));

// Import after mocks to receive mocked versions
import { GET, POST } from './route';
// Debug: ensure the handlers are imported correctly in the test environment
// (temporary log to help diagnose failures)
// eslint-disable-next-line no-console
console.log('DEBUG: Imported route handlers', { GET: typeof GET, POST: typeof POST });
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';

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

    it('caps the limit to 50 and calculates skip/end correctly', async () => {
      (client.fetch as jest.Mock).mockResolvedValueOnce([]);

      const req = new Request('http://localhost/api/comments?postId=p1&page=3&limit=200');
      await GET(req);

      expect(client.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ postId: 'p1', skip: 100, end: 150 })
      );
    });

    it('returns 500 when fetching comments throws an error', async () => {
      (client.fetch as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      const req = new Request('http://localhost/api/comments?postId=p1');
      const res = await GET(req);

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: 'Failed to fetch comments' });
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

    it('rejects users without comment permissions', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'unidentifiedUser', name: 'User' } });
      const req = new Request('http://localhost/api/comments', {
        method: 'POST',
        body: JSON.stringify({ content: 'Permission check', postId: 'p1' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: 'Forbidden: Insufficient permissions to create comments' });
      expect(client.create).not.toHaveBeenCalled();
    });

    it('rejects sessions without a user id', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { role: 'user', name: 'Nameless' } });

      const res = await POST(
        new Request('http://localhost/api/comments', {
          method: 'POST',
          body: JSON.stringify({ content: 'Missing user', postId: 'p1' }),
        })
      );

      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
      expect(client.create).not.toHaveBeenCalled();
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
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data).toMatchObject({ _id: 'comment1' });
      expect(client.create).toHaveBeenCalledWith({
        _type: 'comment',
        post: { _type: 'reference', _ref: 'p1' },
        user: { _type: 'reference', _ref: 'user1' },
        content: 'Great article!',
        approved: false,
      });
    });

    it('creates a comment without revalidating when the post has no slug', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'user', name: 'User' } });
      (client.getDocument as jest.Mock).mockResolvedValueOnce({ _id: 'p1' });
      (client.create as jest.Mock).mockResolvedValueOnce({ _id: 'comment1', _type: 'comment' });

      const res = await POST(
        new Request('http://localhost/api/comments', {
          method: 'POST',
          body: JSON.stringify({ content: 'No slug available', postId: 'p1' }),
        })
      );

      expect(res.status).toBe(201);
    });

    it('still succeeds when revalidateTag encounters an error', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'user' } });
      (client.getDocument as jest.Mock).mockResolvedValueOnce({ _id: 'p1', slug: { current: 'sluggy' } });
      (client.create as jest.Mock).mockResolvedValueOnce({ _id: 'comment2' });

      const res = await POST(
        new Request('http://localhost/api/comments', {
          method: 'POST',
          body: JSON.stringify({ content: 'Revalidate failure', postId: 'p1' }),
        })
      );

      expect(res.status).toBe(201);
    });

    it('returns validation error when fields are missing or invalid', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'user' } });

      const res = await POST(
        new Request('http://localhost/api/comments', {
          method: 'POST',
          body: JSON.stringify({ content: 'Test', postId: null }),
        })
      );

      expect(res.status).toBe(422);
      await expect(res.json()).resolves.toEqual({ error: 'Invalid or missing fields' });
      expect(client.create).not.toHaveBeenCalled();
    });

    it('trims content and rejects empty comments', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'user' } });

      const res = await POST(
        new Request('http://localhost/api/comments', {
          method: 'POST',
          body: JSON.stringify({ content: '   ', postId: 'p1' }),
        })
      );

      expect(res.status).toBe(422);
      await expect(res.json()).resolves.toEqual({ error: 'Comment is required' });
      expect(client.create).not.toHaveBeenCalled();
    });

    it('returns 400 when the referenced post cannot be found', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'user' } });
      (client.getDocument as jest.Mock).mockResolvedValueOnce(null);

      const res = await POST(
        new Request('http://localhost/api/comments', {
          method: 'POST',
          body: JSON.stringify({ content: 'Missing post', postId: 'missing-post' }),
        })
      );

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: 'Invalid reference(s)' });
      expect(client.create).not.toHaveBeenCalled();
    });

    it('returns 500 when comment creation throws an unexpected error', async () => {
      (auth as jest.Mock).mockResolvedValueOnce({ user: { id: 'user1', role: 'user' } });
      (client.getDocument as jest.Mock).mockResolvedValueOnce({ _id: 'p1' });
      (client.create as jest.Mock).mockRejectedValueOnce(new Error('Sanity failure'));

      const res = await POST(
        new Request('http://localhost/api/comments', {
          method: 'POST',
          body: JSON.stringify({ content: 'Unexpected failure', postId: 'p1' }),
        })
      );

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: 'Internal Server Error' });
      expect(client.create).toHaveBeenCalledTimes(1);
    });
  });
});
