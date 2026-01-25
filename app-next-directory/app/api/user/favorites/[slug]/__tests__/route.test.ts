import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type RouteContext = { params: Promise<{ slug: string }> };

type Session = {
  user?: {
    id?: string;
    role?: string | null;
    email?: string | null;
    name?: string | null;
  } | null;
} | null;

const mockAuth = jest.fn<Promise<Session>, []>();
const mockEnsureSanityUser = jest.fn();
const mockUnfavoriteListing = jest.fn();
const mockClientFetch = jest.fn();
const mockClientCreate = jest.fn();
const mockClientDelete = jest.fn();

let POST: typeof import('../route').POST;
let GET: typeof import('../route').GET;
let DELETE: typeof import('../route').DELETE;

const parseResponse = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

const loadRouteHandlers = async () => {
  jest.resetModules();
  mockAuth.mockReset();
  mockEnsureSanityUser.mockReset();
  mockUnfavoriteListing.mockReset();
  mockClientFetch.mockReset();
  mockClientCreate.mockReset();
  mockClientDelete.mockReset();

  jest.doMock('@/lib/auth', () => ({
    __esModule: true,
    auth: mockAuth,
  }));

  jest.doMock('@/lib/sanity/user', () => ({
    __esModule: true,
    ensureSanityUser: mockEnsureSanityUser,
    unfavoriteListing: mockUnfavoriteListing,
  }));

  jest.doMock('@/lib/sanity/client', () => ({
    __esModule: true,
    client: {
      fetch: mockClientFetch,
      create: mockClientCreate,
      delete: mockClientDelete,
    },
  }));

  const mod = await import('../route');
  POST = mod.POST;
  GET = mod.GET;
  DELETE = mod.DELETE;
};

describe('API /api/user/favorites/[slug]', () => {
  beforeEach(async () => {
    await loadRouteHandlers();
  });

  describe('POST', () => {
    const createRequest = () =>
      new Request('http://localhost/api/user/favorites/eco-hub', {
        method: 'POST',
      });

    const context: RouteContext = {
      params: Promise.resolve({ slug: 'eco-hub' }),
    };

    it('returns unauthorized when no session is present', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const response = await POST(createRequest(), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockEnsureSanityUser).not.toHaveBeenCalled();
    });

    it('returns validation error when slug is missing', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });

      const response = await POST(createRequest(), {
        params: Promise.resolve({ slug: '' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ error: 'Listing slug is required' });
    });

    it('returns server error when user cannot be resolved in Sanity', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User', role: 'member' },
      });
      mockEnsureSanityUser.mockResolvedValueOnce(null);

      const response = await POST(createRequest(), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ error: 'Unable to access user profile' });
    });

    it('returns not found when the listing cannot be resolved', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'member' } });
      mockEnsureSanityUser.mockResolvedValueOnce({ _id: 'sanity-user-1' });
      mockClientFetch.mockResolvedValueOnce(null);

      const response = await POST(createRequest(), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(404);
      expect(body).toEqual({ error: 'Listing not found' });
      expect(mockClientFetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "listing"'),
        { slug: 'eco-hub' }
      );
    });

    it('removes an existing favorite and returns updated status', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user-1', role: 'member', email: 'u@example.com' },
      });
      mockEnsureSanityUser.mockResolvedValueOnce({ _id: 'sanity-user-1' });
      mockClientFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockResolvedValueOnce({ _id: 'favorite-1' });

      const response = await POST(createRequest(), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: false, message: 'Removed from favorites' });
      expect(mockClientDelete).toHaveBeenCalledWith('favorite-1');
    });

    it('creates a favorite when none exists', async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: 'user-1', role: 'member', email: 'u@example.com' },
      });
      mockEnsureSanityUser.mockResolvedValueOnce({ _id: 'sanity-user-1' });
      mockClientFetch.mockResolvedValueOnce({ _id: 'listing-1' }).mockResolvedValueOnce(null);
      mockClientCreate.mockResolvedValueOnce({ _id: 'favorite-999' });

      const response = await POST(createRequest(), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({
        favorited: true,
        message: 'Added to favorites',
        favoriteId: 'favorite-999',
      });
      expect(mockClientCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'userFavorite',
          user: expect.objectContaining({ _ref: 'sanity-user-1' }),
          listing: expect.objectContaining({ _ref: 'listing-1' }),
        })
      );
    });

    it('returns server error when toggling favorites fails unexpectedly', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'member' } });
      mockEnsureSanityUser.mockResolvedValueOnce({ _id: 'sanity-user-1' });
      mockClientFetch.mockRejectedValueOnce(new Error('sanity offline'));

      const response = await POST(createRequest(), context);
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ error: 'Internal Server Error' });
    });

    it('handles rejected params promise', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'member' } });
      const response = await POST(createRequest(), {
        params: Promise.reject(new Error('test error')),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('DELETE', () => {
    const request = new Request('http://localhost/api/user/favorites/eco-hub', {
      method: 'DELETE',
    });

    it('returns unauthorized when user is not signed in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const response = await DELETE(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns validation error when slug is missing', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });

      const response = await DELETE(request, {
        params: Promise.resolve({ slug: '' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(400);
      expect(body).toEqual({ error: 'Missing listing slug' });
    });

    it('unfavorites a listing successfully', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      mockUnfavoriteListing.mockResolvedValueOnce(undefined);

      const response = await DELETE(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
      expect(mockUnfavoriteListing).toHaveBeenCalledWith('user-1', 'eco-hub');
    });

    it('handles errors thrown during unfavorite operation', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      mockUnfavoriteListing.mockRejectedValueOnce(new Error('sanity failure'));

      const response = await DELETE(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(500);
      expect(body).toEqual({ error: 'Failed to unfavorite listing' });
    });
  });

  describe('GET', () => {
    const request = new Request('http://localhost/api/user/favorites/eco-hub');

    it('returns false when the user is not signed in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const response = await GET(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: false });
    });

    it('handles rejected params promise', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      const response = await GET(request, {
        params: Promise.reject(new Error('test error')),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: false });
    });

    it('returns false when slug is missing', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });

      const response = await GET(request, {
        params: Promise.resolve({ slug: '' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: false });
    });

    it('returns false when the listing cannot be found', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      mockClientFetch.mockResolvedValueOnce(null);

      const response = await GET(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: false });
    });

    it('returns false when no favorite record exists for the user', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      mockEnsureSanityUser.mockResolvedValueOnce({ _id: 'sanity-user-1' });
      mockClientFetch.mockResolvedValueOnce({ _id: 'listing-1' }).mockResolvedValueOnce(null);

      const response = await GET(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: false });
      expect(mockClientFetch).toHaveBeenLastCalledWith(expect.stringContaining('userFavorite'), {
        sanityUserId: 'sanity-user-1',
        listingId: 'listing-1',
      });
    });

    it('returns true when the listing is already favorited', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      mockEnsureSanityUser.mockResolvedValueOnce({ _id: 'sanity-user-1' });
      mockClientFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockResolvedValueOnce({ _id: 'favorite-1' });

      const response = await GET(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: true });
    });

    it('returns false when the favorite lookup throws an error', async () => {
      mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
      mockClientFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockRejectedValueOnce(new Error('sanity offline'));

      const response = await GET(request, {
        params: Promise.resolve({ slug: 'eco-hub' }),
      });
      const { status, body } = await parseResponse(response);

      expect(status).toBe(200);
      expect(body).toEqual({ favorited: false });
    });
  });
});
