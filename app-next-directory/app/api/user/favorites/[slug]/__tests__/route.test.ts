import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, DELETE, GET } from '../route';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser, unfavoriteListing } from '@/lib/sanity/user';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/lib/sanity/user', () => ({
  ensureSanityUser: jest.fn(),
  unfavoriteListing: jest.fn(),
}));

describe('/api/user/favorites/[slug]', () => {
  let mockedAuth: jest.Mock;
  let mockedFetch: jest.Mock;
  let mockedCreate: jest.Mock;
  let mockedDelete: jest.Mock;
  let mockedEnsureSanityUser: jest.Mock;
  let mockedUnfavorite: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth = auth as jest.Mock;
    mockedFetch = client.fetch as jest.Mock;
    mockedCreate = client.create as jest.Mock;
    mockedDelete = client.delete as jest.Mock;
    mockedEnsureSanityUser = ensureSanityUser as jest.Mock;
    mockedUnfavorite = unfavoriteListing as jest.Mock;
  });

  const mockContext = { params: Promise.resolve({ slug: 'test-listing' }) };

  describe('POST - Toggle favorite', () => {
    it('returns 401 when not authenticated', async () => {
      mockedAuth.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/user/favorites/test');
      const response = await POST(request, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('adds favorite when not already favorited', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user' },
      });
      mockedEnsureSanityUser.mockResolvedValue({ _id: 'sanity-1' });
      mockedFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockResolvedValueOnce(null); // no existing favorite
      mockedCreate.mockResolvedValue({ _id: 'fav-1' });
      
      const request = new NextRequest('http://localhost/api/user/favorites/test');
      const response = await POST(request, mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorited).toBe(true);
    });

    it('removes favorite when already favorited', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user' },
      });
      mockedEnsureSanityUser.mockResolvedValue({ _id: 'sanity-1' });
      mockedFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockResolvedValueOnce({ _id: 'fav-1' }); // existing favorite
      
      const request = new NextRequest('http://localhost/api/user/favorites/test');
      const response = await POST(request, mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorited).toBe(false);
    });
  });

  describe('GET - Check favorite status', () => {
    it('returns not favorited when not authenticated', async () => {
      mockedAuth.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/user/favorites/test');
      const response = await GET(request, mockContext);
      const json = await response.json();

      expect(json.favorited).toBe(false);
    });

    it('returns favorited status', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user' },
      });
      mockedFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockResolvedValueOnce({ _id: 'fav-1' });
      
      const request = new NextRequest('http://localhost/api/user/favorites/test');
      const response = await GET(request, mockContext);
      const json = await response.json();

      expect(json.favorited).toBe(true);
    });
  });

  describe('DELETE - Remove favorite', () => {
    it('removes favorite successfully', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockedUnfavorite.mockResolvedValue(undefined);
      
      const request = new NextRequest('http://localhost/api/user/favorites/test');
      const response = await DELETE(request, mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
