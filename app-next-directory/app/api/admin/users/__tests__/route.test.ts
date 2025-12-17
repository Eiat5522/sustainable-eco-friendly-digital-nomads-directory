import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

// Mock dbConnect
jest.mock('@/lib/dbConnect', () => jest.fn());

// Mock User model
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

// Mock auth DAL functions
jest.mock('@/lib/auth/dal', () => ({
  __esModule: true,
  updateUserRole: jest.fn(),
  updateUserStatus: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
  },
}));

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const dbConnectMock = jest.requireMock('@/lib/dbConnect') as jest.Mock;
const userModelMock = jest.requireMock('@/models/User') as {
  default: {
    find: jest.Mock;
    countDocuments: jest.Mock;
    deleteOne: jest.Mock;
  };
};
const authDalMock = jest.requireMock('@/lib/auth/dal') as {
  updateUserRole: jest.Mock;
  updateUserStatus: jest.Mock;
};
const mockLogger = jest.requireMock('@/lib/logger').structuredLogger as {
  error: jest.Mock;
};

type RouteModule = typeof import('../route');
let GET: RouteModule['GET'];
let PATCH: RouteModule['PATCH'];
let DELETE: RouteModule['DELETE'];

const mockAuth = authMockModule.auth;
const mockFind = userModelMock.default.find;
const mockCountDocuments = userModelMock.default.countDocuments;
const mockDeleteOne = userModelMock.default.deleteOne;
const mockUpdateUserRole = authDalMock.updateUserRole;
const mockUpdateUserStatus = authDalMock.updateUserStatus;

beforeAll(async () => {
  ({ GET, PATCH, DELETE } = await import('../route'));
});

describe('/api/admin/users', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFind.mockReset();
    mockCountDocuments.mockReset();
    mockDeleteOne.mockReset();
    mockUpdateUserRole.mockReset();
    mockUpdateUserStatus.mockReset();
    mockLogger.error.mockReset();

    // Default mock implementations
    mockFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    mockCountDocuments.mockResolvedValue(0);
    mockUpdateUserRole.mockResolvedValue(true);
    mockUpdateUserStatus.mockResolvedValue(true);
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
  });

  it('requires admin access for GET', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const request = { url: 'https://example.com/api/admin/users', headers: new Headers() } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('returns filtered user list with pagination metadata', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    const mockUsers = [
      {
        _id: 'user-1',
        name: 'Eco Warrior',
        email: 'eco@example.com',
        role: 'user',
        createdAt: new Date('2024-04-05T12:00:00.000Z'),
        updatedAt: new Date('2024-04-10T00:00:00.000Z'),
        status: 'active',
      },
    ];

    mockFind.mockReturnValue({
      select: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockUsers),
            }),
          }),
        }),
      }),
    });
    mockCountDocuments.mockResolvedValue(120);

    const request = {
      url: 'https://example.com/api/admin/users?page=2&limit=50&search=eco&role=user',
      headers: new Headers(),
    } as any;

    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.users).toEqual([
      {
        id: 'user-1',
        name: 'Eco Warrior',
        email: 'eco@example.com',
        role: 'user',
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
    expect(json.filters).toEqual({ search: 'eco', role: 'user' });
  });

  it('handles errors when fetching users', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFind.mockImplementation(() => {
      throw new Error('database unavailable');
    });

    const request = { url: 'https://example.com/api/admin/users', headers: new Headers() } as any;
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
      headers: new Headers(),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockUpdateUserRole).not.toHaveBeenCalled();
  });

  it('validates required userId', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const request = {
      json: () => Promise.resolve({ status: 'inactive' }),
      headers: new Headers(),
    } as any;

    const response = await PATCH(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('userId is required');
  });

  it('updates users with valid payloads', async () => {
    // @ts-expect-error - Type assertion to bypass TypeScript strict typing for mock
    mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } });
    mockUpdateUserRole.mockResolvedValue(true);
    mockUpdateUserStatus.mockResolvedValue(true);

    const request = {
      json: () =>
        Promise.resolve({
          userId: 'user-123',
          role: 'user',
          status: 'inactive',
        }),
      headers: new Headers(),
    };

    const response = await PATCH(request as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      message: 'User updated successfully',
      userId: 'user-123',
    });

    expect(mockUpdateUserRole).toHaveBeenCalledWith('user-123', 'user');
    expect(mockUpdateUserStatus).toHaveBeenCalledWith('user-123', 'inactive');
  });

  it('handles errors when updating users', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin', id: 'admin-1' } } as any);
    mockUpdateUserStatus.mockRejectedValueOnce(new Error('update failed'));

    const request = {
      json: () => Promise.resolve({ userId: 'user-1', status: 'inactive' }),
      headers: new Headers(),
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

  it('deletes users successfully', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin', id: 'super-1' } } as any);
    mockDeleteOne.mockResolvedValueOnce({ deletedCount: 1 });

    const request = {
      json: () => Promise.resolve({ userId: 'user-7' }),
      headers: new Headers(),
    } as any;

    const response = await DELETE(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      message: 'User deleted successfully',
      userId: 'user-7',
    });
    expect(mockDeleteOne).toHaveBeenCalledWith({ _id: 'user-7' });
  });

  it('handles errors when deleting users', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin', id: 'super-1' } } as any);
    mockDeleteOne.mockRejectedValueOnce(new Error('delete failed'));

    const request = {
      json: () => Promise.resolve({ userId: 'user-9' }),
      headers: new Headers(),
    } as any;

    const response = await DELETE(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to delete user');
    expect(mockLogger.error).toHaveBeenCalledWith('Admin users DELETE error', expect.any(Error), {
      method: 'DELETE',
      route: '/api/admin/users',
    });
  });
});
