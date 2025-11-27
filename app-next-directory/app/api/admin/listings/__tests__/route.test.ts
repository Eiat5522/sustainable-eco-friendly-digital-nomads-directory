import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => {
  const fetchMock = jest.fn();
  const commitMock = jest.fn();
  const setMock = jest.fn().mockImplementation(() => ({ commit: commitMock }));
  const patchMock = jest.fn().mockImplementation(() => ({ set: setMock }));
  const deleteMock = jest.fn();

  const clientInstance = {
    fetch: fetchMock,
    patch: patchMock,
    delete: deleteMock,
  };

  return {
    __esModule: true,
    client: jest.fn(() => clientInstance),
    __mock: { fetchMock, patchMock, setMock, commitMock, deleteMock },
  };
});

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const clientMockModule = jest.requireMock('@/lib/sanity/client') as {
  client: { fetch: jest.Mock; patch: jest.Mock; delete: jest.Mock };
  __mock: {
    fetchMock: jest.Mock;
    patchMock: jest.Mock;
    setMock: jest.Mock;
    commitMock: jest.Mock;
    deleteMock: jest.Mock;
  };
};

type RouteModule = typeof import('../route');
let GET: RouteModule['GET'];
let PATCH: RouteModule['PATCH'];
let DELETE: RouteModule['DELETE'];

const mockAuth = authMockModule.auth;
const mockFetch = clientMockModule.__mock.fetchMock;
const mockPatch = clientMockModule.__mock.patchMock;
const mockSet = clientMockModule.__mock.setMock;
const mockCommit = clientMockModule.__mock.commitMock;
const mockDelete = clientMockModule.__mock.deleteMock;

beforeAll(async () => {
  ({ GET, PATCH, DELETE } = await import('../route'));
});

describe('/api/admin/listings', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetch.mockReset();
    mockPatch.mockReset();
    mockSet.mockReset();
    mockCommit.mockReset();
    mockDelete.mockReset();
    mockSet.mockImplementation(() => ({ commit: mockCommit }));
    mockPatch.mockImplementation(() => ({ set: mockSet }));
    mockCommit.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  describe('GET', () => {
    it('requires admin access', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

      const request = { url: 'https://example.com/api/admin/listings' } as any;
      const response = await GET(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Admin access required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns filtered listing list with pagination metadata', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
      mockFetch.mockResolvedValueOnce([
        {
          _id: 'listing-1',
          name: 'Eco Cafe',
          slug: { current: 'eco-cafe' },
          type: 'cafe',
          status: 'published',
          _createdAt: '2024-04-05T12:00:00.000Z',
          _updatedAt: '2024-04-10T00:00:00.000Z',
          city: 'Berlin',
          moderationStatus: 'approved',
          isFeatured: false,
        },
      ]);
      mockFetch.mockResolvedValueOnce(1);

      const request = { url: 'https://example.com/api/admin/listings?page=1&limit=20' } as any;
      const response = await GET(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.listings).toHaveLength(1);
      expect(json.listings[0]).toMatchObject({
        id: 'listing-1',
        name: 'Eco Cafe',
        slug: 'eco-cafe',
        type: 'cafe',
        status: 'published',
      });
      expect(json.pagination).toMatchObject({
        page: 1,
        limit: 20,
        totalCount: 1,
      });
    });

    it('handles search filter', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
      mockFetch.mockResolvedValueOnce([]);
      mockFetch.mockResolvedValueOnce(0);

      const request = { url: 'https://example.com/api/admin/listings?search=cafe' } as any;
      const response = await GET(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.filters.search).toBe('cafe');
    });
  });

  describe('PATCH', () => {
    it('requires admin access', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

      const request = {
        json: async () => ({ listingId: 'listing-1', action: 'publish' }),
      } as any;
      const response = await PATCH(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Admin access required');
    });

    it('updates listing status to published', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as any);

      const request = {
        json: async () => ({ listingId: 'listing-1', action: 'publish' }),
      } as any;
      const response = await PATCH(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.message).toBe('Listing updated successfully');
      expect(mockPatch).toHaveBeenCalledWith('listing-1');
      expect(mockCommit).toHaveBeenCalled();
    });

    it('suspends listing', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as any);

      const request = {
        json: async () => ({ listingId: 'listing-1', action: 'suspend' }),
      } as any;
      const response = await PATCH(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.action).toBe('suspend');
    });

    it('returns error for missing listingId', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

      const request = {
        json: async () => ({ action: 'publish' }),
      } as any;
      const response = await PATCH(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('listingId is required');
    });

    it('returns error for invalid action', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

      const request = {
        json: async () => ({ listingId: 'listing-1', action: 'invalid' }),
      } as any;
      const response = await PATCH(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Valid action is required');
    });
  });

  describe('DELETE', () => {
    it('requires admin access', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

      const request = {
        json: async () => ({ listingId: 'listing-1' }),
      } as any;
      const response = await DELETE(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Admin access required');
    });

    it('deletes listing', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as any);

      const request = {
        json: async () => ({ listingId: 'listing-1' }),
      } as any;
      const response = await DELETE(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.message).toBe('Listing deleted successfully');
      expect(mockDelete).toHaveBeenCalledWith('listing-1');
    });

    it('returns error for missing listingId', async () => {
      mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

      const request = {
        json: async () => ({}),
      } as any;
      const response = await DELETE(request, { params: Promise.resolve({}) });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('listingId is required');
    });
  });
});
