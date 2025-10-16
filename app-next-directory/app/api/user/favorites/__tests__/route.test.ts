import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE, testControl } from '../route';

describe('/api/user/favorites', () => {
  const mockedAuth = jest.fn();
  const mockedFetch = jest.fn();
  const mockedCreateOrReplace = jest.fn();
  const mockedDelete = jest.fn();
  const mockedEnsureSanityUser = jest.fn();

  beforeEach(async () => {
    mockedAuth.mockReset();
    mockedFetch.mockReset();
    mockedCreateOrReplace.mockReset();
    mockedDelete.mockReset();
    mockedEnsureSanityUser.mockReset();

    testControl.authOverride = mockedAuth;
    testControl.clientFetchOverride = mockedFetch;
    testControl.clientCreateOrReplaceOverride = mockedCreateOrReplace;
    testControl.clientDeleteOverride = mockedDelete;
    testControl.ensureSanityUserOverride = mockedEnsureSanityUser;
    testControl.parseBodyOverride = undefined;
  });

  afterEach(() => {
    testControl.authOverride = undefined;
    testControl.clientFetchOverride = undefined;
    testControl.clientCreateOrReplaceOverride = undefined;
    testControl.clientDeleteOverride = undefined;
    testControl.ensureSanityUserOverride = undefined;
    testControl.parseBodyOverride = undefined;
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
      testControl.parseBodyOverride = async () => ({ slug: 'test-listing' });
      
      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
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
      testControl.parseBodyOverride = async () => ({ slug: 'test-listing' });
      
      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'DELETE',
      });
      
      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorited).toBe(false);
    });
  });
});
