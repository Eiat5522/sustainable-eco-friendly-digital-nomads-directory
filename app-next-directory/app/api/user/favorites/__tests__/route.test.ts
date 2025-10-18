import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// We'll mock the modules the route imports so tests don't need to mutate exported testControl
const mockedAuth = jest.fn();
const mockedFetch = jest.fn();
const mockedCreateOrReplace = jest.fn();
const mockedDelete = jest.fn();
const mockedEnsureSanityUser = jest.fn();

jest.mock('@/lib/auth', () => ({ auth: (...args: any[]) => mockedAuth(...args) }));
jest.mock('@/lib/sanity/client', () => ({ client: { fetch: (...args: any[]) => mockedFetch(...args), createOrReplace: (...args: any[]) => mockedCreateOrReplace(...args), delete: (...args: any[]) => mockedDelete(...args) } }));
jest.mock('@/lib/sanity/user', () => ({ ensureSanityUser: (...args: any[]) => mockedEnsureSanityUser(...args) }));

let GET: any;
let POST: any;
let DELETE: any;
let routeTestControl: any;

describe('/api/user/favorites', () => {
  beforeEach(async () => {
    jest.resetModules();
    mockedAuth.mockReset();
    mockedFetch.mockReset();
    mockedCreateOrReplace.mockReset();
    mockedDelete.mockReset();
    mockedEnsureSanityUser.mockReset();

    // require the route after mocks are registered
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ({ GET, POST, DELETE, testControl: routeTestControl } = require('../route'));

    // ensure parseBody override starts undefined
    routeTestControl.parseBodyOverride = undefined;
  });

  afterEach(() => {
    if (routeTestControl) {
      routeTestControl.authOverride = undefined;
      routeTestControl.clientFetchOverride = undefined;
      routeTestControl.clientCreateOrReplaceOverride = undefined;
      routeTestControl.clientDeleteOverride = undefined;
      routeTestControl.ensureSanityUserOverride = undefined;
      routeTestControl.parseBodyOverride = undefined;
    }
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

    it('returns 500 when the Sanity user cannot be ensured', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user' },
      });
      mockedEnsureSanityUser.mockResolvedValue(null);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Unable to access user profile');
    });

    it('returns 500 when fetching favorites throws an error', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
      mockedEnsureSanityUser.mockResolvedValue({ _id: 'sanity-1' });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedFetch.mockRejectedValue(new Error('sanity unavailable'));

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');

      consoleErrorSpy.mockRestore();
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
  routeTestControl.parseBodyOverride = async () => ({ slug: 'test-listing' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorited).toBe(true);
    });

    it('returns 500 when parsing the request body fails', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user' },
      });
  routeTestControl.parseBodyOverride = async () => {
        throw new Error('bad body');
      };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');
      expect(mockedEnsureSanityUser).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('validates that the listing slug is provided', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
  routeTestControl.parseBodyOverride = async () => ({ slug: '' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Listing slug is required');
    });

    it('returns 500 when the Sanity user lookup fails', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
      mockedEnsureSanityUser.mockResolvedValue(null);
  routeTestControl.parseBodyOverride = async () => ({ slug: 'test' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Unable to access user profile');
    });

    it('returns 404 when the listing cannot be found', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
      mockedEnsureSanityUser.mockResolvedValue({ _id: 'sanity-1' });
      mockedFetch.mockResolvedValue(null);
  routeTestControl.parseBodyOverride = async () => ({ slug: 'missing-listing' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Listing not found');
    });

    it('returns 500 when the favorite cannot be created', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
      mockedEnsureSanityUser.mockResolvedValue({ _id: 'sanity-1' });
      mockedFetch.mockResolvedValue({ _id: 'listing-1' });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedCreateOrReplace.mockRejectedValue(new Error('sanity failure'));
  routeTestControl.parseBodyOverride = async () => ({ slug: 'listing' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'POST',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');

      consoleErrorSpy.mockRestore();
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
  routeTestControl.parseBodyOverride = async () => ({ slug: 'test-listing' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.favorited).toBe(false);
    });

    it('returns 400 when the slug is missing from the payload', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1' } });
  routeTestControl.parseBodyOverride = async () => ({ slug: '' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Listing slug is required');
    });

    it('returns 404 when the listing lookup fails', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockedFetch.mockResolvedValueOnce(null);
  routeTestControl.parseBodyOverride = async () => ({ slug: 'missing' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Listing not found');
    });

    it('returns a friendly message when no favorite exists', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockedFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockResolvedValueOnce(null);
  routeTestControl.parseBodyOverride = async () => ({ slug: 'test-listing' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({ favorited: false, message: 'Not in favorites' });
    });

    it('propagates errors from the Sanity client', async () => {
      mockedAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockedFetch
        .mockResolvedValueOnce({ _id: 'listing-1' })
        .mockRejectedValueOnce(new Error('sanity down'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  routeTestControl.parseBodyOverride = async () => ({ slug: 'listing' });

      const request = new NextRequest('http://localhost/api/user/favorites', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal Server Error');

      consoleErrorSpy.mockRestore();
    });
  });
});
