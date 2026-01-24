import { cleanup, render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/auth/dal', () => ({
  getUserById: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

const editUserFormMock = jest.fn();

jest.mock('../EditUserForm', () => ({
  EditUserForm: (props: unknown) => {
    editUserFormMock(props);
    return <div data-testid="edit-user-form-mock" />;
  },
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.MockedFunction<
  () => Promise<{ user?: unknown } | null>
>;
const mockGetUserById = jest.requireMock('@/lib/auth/dal').getUserById as jest.MockedFunction<
  (id: string) => Promise<unknown>
>;
const mockHeaders = jest.requireMock('next/headers').headers as jest.MockedFunction<
  () => Promise<unknown>
>;

describe('EditUserPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redirectMock.mockReset();
    mockHeaders.mockResolvedValue({
      get: jest.fn(() => null),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the edit user page for admin users', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
    });

    const EditUserPage = (await import('../[id]/page')).default;
    const element = await EditUserPage({ params: Promise.resolve({ id: 'user-123' }) });
    render(element);

    expect(screen.getByTestId('admin-edit-user-page')).toBeInTheDocument();
    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByText('Modify role and account status for this user.')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-form-mock')).toBeInTheDocument();
    expect(editUserFormMock).toHaveBeenCalledWith({
      initialUser: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
      },
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('renders the edit user page for superAdmin users', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'super-admin-1', role: 'superAdmin' },
    });
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      status: 'pending',
    });

    const EditUserPage = (await import('../[id]/page')).default;
    const element = await EditUserPage({ params: Promise.resolve({ id: 'user-456' }) });
    render(element);

    expect(screen.getByTestId('admin-edit-user-page')).toBeInTheDocument();
    expect(screen.getByTestId('edit-user-form-mock')).toBeInTheDocument();
    expect(editUserFormMock).toHaveBeenCalledWith({
      initialUser: {
        id: 'user-456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'editor',
        status: 'pending',
      },
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects when user is not an admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-99', role: 'user' },
    });
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const EditUserPage = (await import('../[id]/page')).default;

    await expect(EditUserPage({ params: Promise.resolve({ id: 'user-123' }) })).rejects.toThrow(
      'redirect'
    );
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/user/user-123');
  });

  it('redirects when user is an editor', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'editor-1', role: 'editor' },
    });
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const EditUserPage = (await import('../[id]/page')).default;

    await expect(EditUserPage({ params: Promise.resolve({ id: 'user-123' }) })).rejects.toThrow(
      'redirect'
    );
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/user/user-123');
  });

  it('redirects when user is a venueOwner', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'venue-1', role: 'venueOwner' },
    });
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const EditUserPage = (await import('../[id]/page')).default;

    await expect(EditUserPage({ params: Promise.resolve({ id: 'user-123' }) })).rejects.toThrow(
      'redirect'
    );
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/user/user-123');
  });

  it('redirects when user is not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const EditUserPage = (await import('../[id]/page')).default;

    await expect(EditUserPage({ params: Promise.resolve({ id: 'user-123' }) })).rejects.toThrow(
      'redirect'
    );
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/user/user-123');
  });

  it('redirects when session user has no role', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-99' },
    });
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const EditUserPage = (await import('../[id]/page')).default;

    await expect(EditUserPage({ params: Promise.resolve({ id: 'user-123' }) })).rejects.toThrow(
      'redirect'
    );
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/user/user-123');
  });

  it('calls getUserById with the correct id', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockGetUserById.mockResolvedValueOnce({
      id: 'user-unique-999',
      name: 'Test User',
      email: 'test@example.com',
      role: 'editor',
      status: 'active',
    });

    const EditUserPage = (await import('../[id]/page')).default;
    await EditUserPage({ params: Promise.resolve({ id: 'user-unique-999' }) });

    expect(mockGetUserById).toHaveBeenCalledWith('user-unique-999');
  });

  it('passes status through to EditUserForm as provided by getUserById', async () => {
    // Clear and reset mocks completely
    mockGetUserById.mockReset();
    mockAuth.mockReset();
    
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    const testUser = {
      id: 'user-status-test',
      name: 'Status Test',
      email: 'status@example.com',
      role: 'user' as const,
      status: 'pending' as const,
    };
    mockGetUserById.mockResolvedValue(testUser);

    const EditUserPage = (await import('../[id]/page')).default;
    const element = await EditUserPage({ params: Promise.resolve({ id: 'user-status-test' }) });

    render(element);

    expect(screen.getByTestId('edit-user-form-mock')).toBeInTheDocument();
    expect(editUserFormMock).toHaveBeenCalledWith({
      initialUser: expect.objectContaining({
        id: 'user-status-test',
        status: 'pending',
      }),
    });
  });
});
