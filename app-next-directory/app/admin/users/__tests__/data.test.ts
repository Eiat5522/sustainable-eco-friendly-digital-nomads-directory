import { getAdminUsers } from '../data';

jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn(),
}));

jest.mock('@/lib/server/cookies', () => ({
  getCookieHeader: jest.fn(),
}));

const mockGetBaseUrl = jest.requireMock('@/lib/absolute-url').getBaseUrl as jest.MockedFunction<
  () => Promise<string>
>;
const mockGetCookieHeader = jest.requireMock('@/lib/server/cookies')
  .getCookieHeader as jest.MockedFunction<() => Promise<string | null>>;

const mockUsersResponse = {
  users: [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user' as const,
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
      lastActiveAt: '2024-01-15T10:00:00.000Z',
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor' as const,
      status: 'suspended' as const,
      createdAt: '2024-01-02T00:00:00.000Z',
      lastActiveAt: null,
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    totalCount: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: null,
    role: null,
  },
};

describe('getAdminUsers', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
    mockGetBaseUrl.mockResolvedValue('https://example.com');
    mockGetCookieHeader.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches users successfully with default parameters', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    const result = await getAdminUsers();

    expect(result).toEqual({
      ...mockUsersResponse,
      users: [
        { ...mockUsersResponse.users[0], status: 'active' },
        { ...mockUsersResponse.users[1], status: 'inactive' },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=1&limit=20',
      { headers: {} }
    );
  });

  it('fetches users with custom page parameter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ page: 2 });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=2&limit=20',
      { headers: {} }
    );
  });

  it('fetches users with search parameter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ search: 'john' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=1&limit=20&search=john',
      { headers: {} }
    );
  });

  it('fetches users with role filter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ role: 'editor' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=1&limit=20&role=editor',
      { headers: {} }
    );
  });

  it('fetches users with all parameters combined', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ page: 3, search: 'test', role: 'admin' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=3&limit=20&search=test&role=admin',
      { headers: {} }
    );
  });

  it('includes cookie header when available', async () => {
    mockGetCookieHeader.mockResolvedValueOnce('session=abc123');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=1&limit=20',
      { headers: { cookie: 'session=abc123' } }
    );
  });

  it('normalizes suspended status to inactive', async () => {
    const responseWithSuspended = {
      ...mockUsersResponse,
      users: [{ ...mockUsersResponse.users[0], status: 'suspended' as const }],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithSuspended,
    });

    const result = await getAdminUsers();

    expect(result.users[0].status).toBe('inactive');
  });

  it('normalizes pending status to inactive', async () => {
    const responseWithPending = {
      ...mockUsersResponse,
      users: [{ ...mockUsersResponse.users[0], status: 'pending' as const }],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithPending,
    });

    const result = await getAdminUsers();

    expect(result.users[0].status).toBe('inactive');
  });

  it('keeps active status as active', async () => {
    const responseWithActive = {
      ...mockUsersResponse,
      users: [{ ...mockUsersResponse.users[0], status: 'active' as const }],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithActive,
    });

    const result = await getAdminUsers();

    expect(result.users[0].status).toBe('active');
  });

  it('normalizes inactive status to inactive', async () => {
    const responseWithInactive = {
      ...mockUsersResponse,
      users: [{ ...mockUsersResponse.users[0], status: 'inactive' as const }],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithInactive,
    });

    const result = await getAdminUsers();

    expect(result.users[0].status).toBe('inactive');
  });

  it('throws error when fetch fails with error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized access' }),
    });

    await expect(getAdminUsers()).rejects.toThrow('Unauthorized access');
  });

  it('throws generic error when fetch fails without error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    await expect(getAdminUsers()).rejects.toThrow('Failed to fetch users');
  });

  it('throws generic error when error is not a string', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'Complex error' } }),
    });

    await expect(getAdminUsers()).rejects.toThrow('Failed to fetch users');
  });

  it('handles malformed JSON in error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    await expect(getAdminUsers()).rejects.toThrow('Failed to fetch users');
  });

  it('throws error when response validation fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ users: 'invalid' }), // Invalid schema
    });

    await expect(getAdminUsers()).rejects.toThrow('Invalid admin users response payload');
  });

  it('throws error when users array is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        pagination: mockUsersResponse.pagination,
        filters: mockUsersResponse.filters,
      }),
    });

    await expect(getAdminUsers()).rejects.toThrow('Invalid admin users response payload');
  });

  it('throws error when pagination is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: mockUsersResponse.users,
        filters: mockUsersResponse.filters,
      }),
    });

    await expect(getAdminUsers()).rejects.toThrow('Invalid admin users response payload');
  });

  it('throws error when filters is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: mockUsersResponse.users,
        pagination: mockUsersResponse.pagination,
      }),
    });

    await expect(getAdminUsers()).rejects.toThrow('Invalid admin users response payload');
  });

  it('handles empty users array', async () => {
    const emptyResponse = {
      ...mockUsersResponse,
      users: [],
const emptyResponse = {
  ...mockUsersResponse,
  users: [],
  pagination: {
    ...mockUsersResponse.pagination,
    totalCount: 0,
  },
};

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    });

    const result = await getAdminUsers();

    expect(result.users).toEqual([]);
    expect(result.pagination.totalCount).toBe(0);
  });

  it('ignores null role filter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ role: null });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=1&limit=20',
      { headers: {} }
    );
  });

it.each(['user', 'editor', 'venueOwner', 'admin', 'superAdmin'] as const)(
  'handles %s role filter',
  async (role) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockUsersResponse,
        users: [{ ...mockUsersResponse.users[0], role }],
      }),
    });

    const result = await getAdminUsers({ role });
    expect(result.users[0].role).toBe(role);
  }
);

  it('handles page parameter of 0', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ page: 0 });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=0&limit=20',
      { headers: {} }
    );
  });

  it('handles very large page numbers', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ page: 9999 });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=9999&limit=20',
      { headers: {} }
    );
  });

  it('handles special characters in search parameter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    await getAdminUsers({ search: 'test@example.com' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/admin/users?page=1&limit=20&search=test%40example.com',
      { headers: {} }
    );
  });

  it('preserves all user fields in response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsersResponse,
    });

    const result = await getAdminUsers();

    expect(result.users[0]).toMatchObject({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastActiveAt: '2024-01-15T10:00:00.000Z',
    });
  });
});
