import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { UserManagementTable } from '../UserManagementTable';

describe('UserManagementTable', () => {
  const originalFetch = global.fetch;
  const originalConfirm = global.confirm;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.confirm = jest.fn().mockReturnValue(true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.confirm = originalConfirm;
    jest.useRealTimers();
  });

  type UsersResponse = {
    users: Array<{
      id: string;
      name: string | null;
      email: string | null;
      role: string;
      createdAt: string;
      lastActiveAt: string | null;
      status: 'active' | 'inactive';
    }>;
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      search: string | null;
      role: string | null;
    };
  };

  const createUsersResponse = (
    users: UsersResponse['users'],
    overrides: Partial<UsersResponse> = {}
  ): UsersResponse => ({
    users,
    pagination: {
      page: 1,
      limit: 20,
      totalCount: users.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      ...overrides.pagination,
    },
    filters: {
      search: null,
      role: null,
      ...overrides.filters,
    },
  });

  it('renders loaded users, formats activity timestamps, and triggers filter fetches', async () => {
    const now = new Date();
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(
        createUsersResponse([
          {
            id: 'user-1',
            name: 'Alice Example',
            email: 'alice@example.com',
            role: 'user',
            createdAt: now.toISOString(),
            lastActiveAt: now.toISOString(),
            status: 'active',
          },
          {
            id: 'user-2',
            name: null,
            email: 'second@example.com',
            role: 'admin',
            createdAt: now.toISOString(),
            lastActiveAt: null,
            status: 'inactive',
          },
          {
            id: 'user-3',
            name: 'Invalid Date',
            email: 'third@example.com',
            role: 'venueOwner',
            createdAt: now.toISOString(),
            lastActiveAt: 'invalid-date',
            status: 'active',
          },
          {
            id: 'user-4',
            name: 'Frequent Visitor',
            email: 'frequent@example.com',
            role: 'venueOwner',
            createdAt: now.toISOString(),
            lastActiveAt: fiveHoursAgo,
            status: 'active',
          },
          {
            id: 'user-5',
            name: 'Occasional User',
            email: 'occasional@example.com',
            role: 'admin',
            createdAt: now.toISOString(),
            lastActiveAt: fiveDaysAgo,
            status: 'inactive',
          },
          {
            id: 'user-6',
            name: 'Long Absent',
            email: 'absent@example.com',
            role: 'user',
            createdAt: now.toISOString(),
            lastActiveAt: threeMonthsAgo,
            status: 'inactive',
          },
        ])
      ),
    });

    render(<UserManagementTable currentUserRole="admin" currentUserId="admin-1" />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();

    await screen.findByTestId('user-row-user-1');

    expect(screen.getByText('Just now')).toBeInTheDocument();
    expect(screen.getByText('Never')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('5h ago')).toBeInTheDocument();
    expect(screen.getByText('5d ago')).toBeInTheDocument();
    expect(screen.getByText('3mo ago')).toBeInTheDocument();

    const firstRow = screen.getByTestId('user-row-user-1');
    expect(within(firstRow).queryByRole('combobox')).toBeNull();

    const searchInput = screen.getByPlaceholderText(
      'Search by name or email...'
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'alice' } });
    });

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('search=alice'),
          expect.any(Object)
        );
      },
      { timeout: 3000 }
    );

    const roleFilter = screen.getByLabelText('Filter by role', {
      selector: 'select',
    }) as HTMLSelectElement;

    await act(async () => {
      fireEvent.change(roleFilter, { target: { value: 'admin' } });
    });

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('role=admin'),
          expect.any(Object)
        );
      },
      { timeout: 3000 }
    );
  });

  it('displays an error message when loading users fails', async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Unable to fetch users' }),
    });

    render(<UserManagementTable currentUserRole="admin" currentUserId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByText('Unable to fetch users')).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
  });

  it('allows super admins to update user roles and clears feedback after timeout', async () => {
    jest.useFakeTimers(); // Start with fake timers from the beginning
    const fetchMock = global.fetch as jest.Mock;

    const initialResponse = createUsersResponse([
      {
        id: 'target-user',
        name: 'Target User',
        email: 'target@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        status: 'active',
      },
    ]);
    const updatedResponse = createUsersResponse([
      {
        ...initialResponse.users[0],
        role: 'venueOwner',
      },
    ]);

    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(initialResponse) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(updatedResponse) });

    render(<UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />);

    // Flush pending promises and timers for initial render
    await act(async () => {
      jest.runAllTimers();
    });

    const row = await screen.findByTestId('user-row-target-user');
    const select = within(row).getByDisplayValue('User') as HTMLSelectElement;

    // Change the role
    fireEvent.change(select, { target: { value: 'venueOwner' } });

    // Flush timers and promises for the role change
    await act(async () => {
      jest.runAllTimers();
    });

    // The fetch should have been called
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/users',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ userId: 'target-user', role: 'venueOwner' }),
      })
    );

    // Wait for the status message to appear
    const statusElement = await screen.findByRole('status');
    expect(statusElement).toHaveTextContent('User role updated to venueOwner');

    // Advance timers by 3 seconds to clear the feedback
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    // Status should be gone
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it('prevents super admins from changing their own role', async () => {
    const fetchMock = global.fetch as jest.Mock;
    const response = createUsersResponse([
      {
        id: 'super-1',
        name: 'Super Admin',
        email: 'super@example.com',
        role: 'superAdmin',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        status: 'active',
      },
    ]);

    fetchMock.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(response) });

    render(<UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />);

    const row = await screen.findByTestId('user-row-super-1');
    const select = within(row).getByDisplayValue('Super Admin') as HTMLSelectElement;

    fireEvent.change(select, { target: { value: 'admin' } });

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Cannot change your own Super Admin role'
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces errors when status updates fail', async () => {
    const fetchMock = global.fetch as jest.Mock;

    const listResponse = createUsersResponse([
      {
        id: 'inactive-user',
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        status: 'active',
      },
    ]);

    fetchMock
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(listResponse) })
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Unable to update status' }),
      });

    render(<UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />);

    const row = await screen.findByTestId('user-row-inactive-user');
    const button = within(row).getByRole('button', { name: /Deactivate/ });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Unable to update status');
    });
  });

  it('updates user status successfully and clears the success message', async () => {
    jest.useFakeTimers();
    const fetchMock = global.fetch as jest.Mock;

    const listResponse = createUsersResponse([
      {
        id: 'status-user',
        name: 'Status User',
        email: 'status@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        status: 'inactive',
      },
    ]);
    const reloadResponse = createUsersResponse([
      {
        ...listResponse.users[0],
        status: 'active',
      },
    ]);

    fetchMock
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(listResponse) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ success: true }) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(reloadResponse) });

    render(<UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />);

    const row = await screen.findByTestId('user-row-status-user');
    const button = within(row).getByRole('button', { name: /Activate/ });

    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        '/api/admin/users',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ userId: 'status-user', status: 'active' }),
        })
      );
    });

    await screen.findByRole('status');
    expect(screen.getByRole('status')).toHaveTextContent('User activated successfully');

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('renders pagination controls and loads adjacent pages when navigating', async () => {
    const fetchMock = global.fetch as jest.Mock;

    const baseUsers = [
      {
        id: 'paged-user',
        name: 'Paged User',
        email: 'paged@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        status: 'active',
      },
    ];

    const buildResponse = (page: number) =>
      Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue(
          createUsersResponse(baseUsers, {
            pagination: {
              page,
              totalPages: 3,
              hasNextPage: page < 3,
              hasPrevPage: page > 1,
            },
          })
        ),
      });

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      const pageParam = new URL(url, 'https://example.com').searchParams.get('page');
      const page = Number(pageParam ?? 1);
      return buildResponse(Number.isNaN(page) ? 1 : page);
    });

    render(<UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />);

    await screen.findByTestId('user-row-paged-user');
    const initialIndicators = screen.getAllByText(
      (_, element) => element?.textContent?.replace(/\s+/g, ' ').trim() === 'Showing page 1 of 3'
    );
    expect(initialIndicators.length).toBeGreaterThan(0);

    const nextButtons = screen.getAllByRole('button', { name: 'Next' });
    fireEvent.click(nextButtons[0]);

    await waitFor(() => {
      const calledPageTwo = fetchMock.mock.calls.some(([url]) => String(url).includes('page=2'));
      expect(calledPageTwo).toBe(true);
    });
    await screen.findByTestId('user-row-paged-user');

    const pageTwoIndicators = screen.getAllByText(
      (_, element) => element?.textContent?.replace(/\s+/g, ' ').trim() === 'Showing page 2 of 3'
    );
    expect(pageTwoIndicators.length).toBeGreaterThan(0);

    const callsBeforeClick = fetchMock.mock.calls.length;
    const previousButtons = screen.getAllByRole('button', { name: 'Previous' });
    fireEvent.click(previousButtons[0]);

    await waitFor(() => {
      // Verify a NEW call to page=1 occurred after clicking Previous
      const newCalls = fetchMock.mock.calls.slice(callsBeforeClick);
      const calledPageOne = newCalls.some(([url]) => String(url).includes('page=1'));
      expect(calledPageOne).toBe(true);
    });
    await screen.findByTestId('user-row-paged-user');
  });

  it('allows a super admin to delete users after confirmation', async () => {
    jest.useFakeTimers();
    const fetchMock = global.fetch as jest.Mock;
    const initialResponse = createUsersResponse([
      {
        id: 'removable-user',
        name: 'Removable User',
        email: 'remove@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        status: 'active',
      },
    ]);
    const reloadResponse = createUsersResponse([]);

    fetchMock
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(initialResponse) })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ message: 'User deleted successfully' }),
      })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(reloadResponse) });

    const confirmSpy = global.confirm as jest.Mock;

    render(<UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />);

    const row = await screen.findByTestId('user-row-removable-user');
    const deleteButton = within(row).getByRole('button', { name: 'Delete' });

    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        '/api/admin/users',
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ userId: 'removable-user' }),
        })
      );
    });

    await screen.findByRole('status');
    expect(screen.getByRole('status')).toHaveTextContent('User deleted successfully');

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('does not attempt deletion when confirmation is cancelled', async () => {
    const fetchMock = global.fetch as jest.Mock;
    const confirmSpy = global.confirm as jest.Mock;
    confirmSpy.mockReturnValueOnce(false);

    const response = createUsersResponse([
      {
        id: 'cancel-user',
        name: 'Cancel User',
        email: 'cancel@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastActiveAt: null,
        status: 'active',
      },
    ]);

    fetchMock.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(response) });

    render(<UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />);

    const row = await screen.findByTestId('user-row-cancel-user');
    const deleteButton = within(row).getByRole('button', { name: 'Delete' });

    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
