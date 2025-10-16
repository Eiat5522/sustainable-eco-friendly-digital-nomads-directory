import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../route';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    createOrReplace: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/lib/sanity/user', () => ({
  ensureSanityUser: jest.fn(),
}));

describe('/api/user/favorites', () => {
  let mockedAuth: jest.Mock;
  let mockedFetch: jest.Mock;
  let mockedCreateOrReplace: jest.Mock;
  let mockedDelete: jest.Mock;
  let mockedEnsureSanityUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth = auth as jest.Mock;
    mockedFetch = client.fetch as jest.Mock;
    mockedCreateOrReplace = client.createOrReplace as jest.Mock;
    mockedDelete = client.delete as jest.Mock;
    mockedEnsureSanityUser = ensureSanityUser as jest.Mock;
  });

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockedAuth.mockResolvedValue(null);
      
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('returns favorites for authenticated user', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user' },
      });
      mockedEnsureSanityUser.mockResolvedValue({ _id: 'sanity-1' });
      mockedFetch.mockResolvedValue([{ _id: 'fav-1', listing: { name: 'Test' } }]);
      
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorites).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      mockedAuth.mockResolvedValue(null);
      
      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
        body: JSON.stringify({ slug: 'test' }),
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
    });

    it('adds listing to favorites', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user' },
      });
      mockedEnsureSanityUser.mockResolvedValue({ _id: 'sanity-1' });
      mockedFetch.mockResolvedValue({ _id: 'listing-1' });
      mockedCreateOrReplace.mockResolvedValue({ _id: 'fav-1' });
      
      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
        body: JSON.stringify({ slug: 'test-listing' }),
      });
      
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorited).toBe(true);
    });
  });

  describe('DELETE', () => {
    it('removes listing from favorites', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1' },
      });
      mockedFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockResolvedValueOnce({ _id: 'fav-1' });
      
      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'DELETE',
        body: JSON.stringify({ slug: 'test-listing' }),
      });
      
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorited).toBe(false);
    });
  });
});
