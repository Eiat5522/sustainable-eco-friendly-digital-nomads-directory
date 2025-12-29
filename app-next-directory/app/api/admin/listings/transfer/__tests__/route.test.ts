import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockAuth = jest.fn();
jest.mock('@/lib/auth', () => ({ __esModule: true, auth: mockAuth }));

const mockFetch = jest.fn();
const mockPatch = jest.fn();
const mockSet = jest.fn();
const mockAppend = jest.fn();
const mockCommit = jest.fn();

jest.mock('@/lib/sanity', () => ({
  __esModule: true,
  client: {
    fetch: mockFetch,
    patch: jest.fn(() => ({ set: mockSet, append: mockAppend })),
  },
}));

let POST: typeof import('../route').POST;

describe('Admin listing transfer API', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockSet.mockReturnValue({ commit: mockCommit });
    mockAppend.mockReturnValue({ commit: mockCommit });

    const route = await import('../route');
    POST = route.POST;
  });

  it('should transfer listing when admin and target under quota', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'admin-1', role: 'admin' } });

    const listing = { _id: 'listing-1', owner: { _ref: 'user-old' }, ownerHistory: [] };
    mockFetch.mockResolvedValueOnce(listing); // fetch listing
    mockFetch.mockResolvedValueOnce({ _id: 'user-new', maxLocations: 2 }); // fetch ownerDoc
    mockFetch.mockResolvedValueOnce(0); // count current listings for owner
    mockCommit.mockResolvedValueOnce({ _id: 'listing-1', owner: { _ref: 'user-new' } });

    const body = { listingId: 'listing-1', newOwnerId: 'user-new', reason: 'transfer test' };
    const request = new Request('http://localhost/api/admin/listings/transfer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ _id: 'listing-1', owner: { _ref: 'user-new' } });
    expect(mockFetch).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalled();
  });

  it('should reject when non-admin attempts transfer', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'venueOwner' } });
    const request = new Request('http://localhost/api/admin/listings/transfer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: 'l', newOwnerId: 'u' }),
    });

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject when target owner at quota', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'admin-1', role: 'admin' } });
    mockFetch.mockResolvedValueOnce({ _id: 'listing-1', owner: { _ref: 'user-old' } });
    mockFetch.mockResolvedValueOnce({ _id: 'user-new', maxLocations: 1 });
    mockFetch.mockResolvedValueOnce(1); // currentCount == limit

    const request = new Request('http://localhost/api/admin/listings/transfer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: 'listing-1', newOwnerId: 'user-new' }),
    });

    const res = await POST(request);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('quota_exceeded');
  });
});
