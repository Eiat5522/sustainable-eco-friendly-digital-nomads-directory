import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/sanity/client', () => {
  const fetchMock = jest.fn();
  const commitMock = jest.fn();
  const setMock = jest.fn().mockImplementation(() => ({ commit: commitMock }));
  const patchMock = jest.fn().mockImplementation(() => ({ set: setMock }));

  return {
    __esModule: true,
    client: {
      fetch: fetchMock,
      patch: patchMock,
    },
    __mock: { fetchMock, patchMock, setMock, commitMock },
  };
});

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

import { auth } from '@/lib/auth';

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const clientMockModule = jest.requireMock('@/lib/sanity/client') as {
  client: { fetch: jest.Mock; patch: jest.Mock };
  __mock: { fetchMock: jest.Mock; patchMock: jest.Mock; setMock: jest.Mock; commitMock: jest.Mock };
};

type RouteModule = typeof import('../route');
let GET: RouteModule['GET'];
let PATCH: RouteModule['PATCH'];

const mockAuth = authMockModule.auth;
const mockFetch = clientMockModule.__mock.fetchMock;
const mockPatch = clientMockModule.__mock.patchMock;
const mockSet = clientMockModule.__mock.setMock;
const mockCommit = clientMockModule.__mock.commitMock;
const mockLogger = jest.requireMock('@/lib/logger').structuredLogger as {
  error: jest.Mock;
};

beforeAll(async () => {
  ({ GET, PATCH } = await import('../route'));
});

describe('/api/admin/users', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetch.mockReset();
    mockPatch.mockReset();
    mockSet.mockReset();
    mockCommit.mockReset();
    mockSet.mockImplementation(() => ({ commit: mockCommit }));
    mockPatch.mockImplementation(() => ({ set: mockSet }));
    mockCommit.mockResolvedValue(undefined);
    mockLogger.error.mockReset();
  });

  it('requires admin access for GET', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const request = { url: 'https://example.com/api/admin/users' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns filtered user list with pagination metadata', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetch.mockResolvedValueOnce([
      {
        _id: 'user-1',
        name: 'Eco Warrior',
        email: 'eco@example.com',
        role: 'moderator',
        _createdAt: '2024-04-05T12:00:00.000Z',
        lastActiveAt: '2024-04-10T00:00:00.000Z',
        status: 'active',
      },
    ]);
    mockFetch.mockResolvedValueOnce(120);

    const request = {
      url: 'https://example.com/api/admin/users?page=2&limit=50&search=eco&role=moderator',
    } as any;

    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.users).toEqual([
      {
        id: 'user-1',
        name: 'Eco Warrior',
        email: 'eco@example.com',
        role: 'moderator',
        createdAt: '2024-04-05T12:00:00.000Z',
        lastActiveAt: '2024-04-10T00:00:00.000Z',
        status: 'active',
      },
    ]);
    expect(json.pagination).toEqual({
      page: 2,
      limit: 50,
      totalCount: 120,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
    expect(json.filters).toEqual({ search: 'eco', role: 'moderator' });

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `*[_type == "user" && (name match "*eco*" || email match "*eco*") && role == "moderator"] | order(_createdAt desc) [50...100] {
      _id,
      name,
      email,
      role,
      _createdAt,
      lastActiveAt,
      "status": coalesce(status, "active")
    }`
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `count(*[_type == "user" && (name match "*eco*" || email match "*eco*") && role == "moderator"])`
    );
  });

  it('applies default pagination and ignores invalid filters', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetch.mockResolvedValueOnce([]);
    mockFetch.mockResolvedValueOnce(0);

    const request = {
      url: 'https://example.com/api/admin/users?page=0&limit=5&search=   &role=invalid-role',
    } as any;

    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.users).toEqual([]);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
    expect(json.filters).toEqual({ search: null, role: 'invalid-role' });

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `*[_type == "user"  ] | order(_createdAt desc) [0...10] {
      _id,
      name,
      email,
      role,
      _createdAt,
      lastActiveAt,
      "status": coalesce(status, "active")
    }`
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'count(*[_type == "user"  ])'
    );
  });

  it('handles errors when fetching users', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetch.mockRejectedValueOnce(new Error('sanity unavailable'));
    mockFetch.mockResolvedValueOnce(0);

    const request = { url: 'https://example.com/api/admin/users' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to fetch users');
    expect(mockLogger.error).toHaveBeenCalledWith('Admin users GET error', expect.any(Error), {
      method: 'GET',
      route: '/api/admin/users',
    });
  });

  it('requires admin access for PATCH', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const request = {
      json: () => Promise.resolve({ userId: 'user-1', status: 'inactive' }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('validates required userId', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const request = {
      json: () => Promise.resolve({ status: 'inactive' }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('userId is required');
  });

  it('requires super admin for role changes', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } } as any);

    const request = {
      json: () => Promise.resolve({ userId: 'user-1', role: 'moderator' }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('SuperAdmin access required for role changes');
  });

  it('rejects invalid role values', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin', id: 'admin-1' } } as any);

    const request = {
      json: () => Promise.resolve({ userId: 'user-1', role: 'invalid-role' }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid role');
  });

  it('rejects invalid status values', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } } as any);

    const request = {
      json: () => Promise.resolve({ userId: 'user-1', status: 'disabled' }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid status');
  });

  it('prevents super admins from demoting themselves', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin', id: 'admin-1' } } as any);

    const request = {
      json: () => Promise.resolve({ userId: 'admin-1', role: 'admin' }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Cannot change your own superAdmin role');
  });

  it('updates users with valid payloads', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin', id: 'super-1' } } as any);

    const request = {
      json: () => Promise.resolve({
        userId: 'user-123',
        role: 'moderator',
        status: 'inactive',
      }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      message: 'User updated successfully',
      userId: 'user-123',
    });

    expect(mockPatch).toHaveBeenCalledWith('user-123');
    expect(mockSet).toHaveBeenCalledTimes(1);

    const [updateData] = mockSet.mock.calls[0];
    expect(updateData).toMatchObject({
      role: 'moderator',
      status: 'inactive',
      updatedBy: 'super-1',
    });
    expect(typeof updateData.updatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(updateData.updatedAt))).toBe(false);
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });

  it('handles errors when updating users', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockCommit.mockRejectedValueOnce(new Error('commit failed'));

    const request = {
      json: () => Promise.resolve({ userId: 'user-1', status: 'inactive' }),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to update user');
    expect(mockLogger.error).toHaveBeenCalledWith('Admin users PATCH error', expect.any(Error), {
      method: 'PATCH',
      route: '/api/admin/users',
    });
  });

  it('allows superAdmin to access GET endpoint', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin' } } as any);
    mockFetch.mockResolvedValueOnce([]);
    mockFetch.mockResolvedValueOnce(0);

    const request = { url: 'https://example.com/api/admin/users' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles missing user data fields gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    const mockUser = { _id: 'user-1' }; // User with many missing fields
    mockFetch.mockResolvedValueOnce([mockUser]);
    mockFetch.mockResolvedValueOnce(1);

    const request = { url: 'https://example.com/api/admin/users' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.users[0]).toEqual(
      expect.objectContaining({
        id: 'user-1',
        name: null,
        email: null,
        role: 'user',
        lastActiveAt: null,
        status: 'active',
      })
    );
  });

  it('clamps limit parameter correctly', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetch.mockResolvedValueOnce([]);
    mockFetch.mockResolvedValueOnce(0);

    const request = { url: 'https://example.com/api/admin/users?limit=200' } as any;
    await GET(request, { params: Promise.resolve({}) });

    const query = mockFetch.mock.calls[0][0];
    expect(query).toContain('[0...100]');
  });

  it('handles non-numeric page parameter', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetch.mockResolvedValueOnce([]);
    mockFetch.mockResolvedValueOnce(0);

    const request = { url: 'https://example.com/api/admin/users?page=abc' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();
    expect(json.pagination.page).toBe(1);
  });

  it('allows an admin to update only status', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } } as any);
    const request = {
      json: () => Promise.resolve({ userId: 'user-1', status: 'inactive' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(200);
    const [updateData] = mockSet.mock.calls[0];
    expect(updateData).toEqual({
      status: 'inactive',
      updatedAt: expect.any(String),
      updatedBy: 'admin-1',
    });
  });

  it('handles invalid JSON body in PATCH', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    const request = {
      json: () => Promise.reject(new Error('Invalid JSON')),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('userId is required');
  });

  it('handles non-string userId in PATCH', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    const request = {
      json: () => Promise.resolve({ userId: 123 }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.error).toBe('userId is required');
  });

  it('rejects unauthenticated GET request', async () => {
    mockAuth.mockResolvedValue(null);
    const request = { url: 'https://example.com/api/admin/users' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(403);
  });

  it('rejects unauthenticated PATCH request', async () => {
    mockAuth.mockResolvedValue(null);
    const request = {
      json: () => Promise.resolve({ userId: 'user-1', status: 'inactive' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(403);
  });
});
