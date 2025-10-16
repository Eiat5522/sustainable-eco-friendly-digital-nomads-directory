import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserManagementTable } from '../UserManagementTable';

type FetchMock = jest.MockedFunction<typeof fetch>;

const originalFetch = global.fetch;
let fetchMock: FetchMock;

const assignFetchMock = () => {
  fetchMock = jest.fn() as FetchMock;
  (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock;
};

type MockUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: 'user' | 'venueOwner' | 'editor' | 'contentEditor' | 'moderator' | 'admin' | 'superAdmin' | 'unidentifiedUser';
  status: 'active' | 'inactive';
  createdAt: string;
  lastActiveAt: string | null;
};

type MockResponse = {
  users: MockUser[];
  pagination: {
    page: number;
    limit?: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters?: {
    search: string | null;
    role: MockUser['role'] | null;
  };
};

const buildResponse = (data: MockResponse) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);

beforeEach(() => {
  assignFetchMock();
});

afterEach(() => {
  jest.useRealTimers();
  fetchMock.mockReset();
});

afterAll(() => {
  (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch = originalFetch;
});

describe('UserManagementTable', () => {
  it('loads users, renders their information, and formats time labels', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-03-10T12:00:00Z'));

    const responseData: MockResponse = {
      users: [
        {
          id: 'user-1',
          name: 'Alice Green',
          email: 'alice@example.com',
          role: 'editor',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-10T11:00:00Z',
        },
        {
          id: 'user-2',
          name: null,
          email: 'bob@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-01-05T00:00:00.000Z',
          lastActiveAt: null,
        },
        {
          id: 'user-3',
          name: 'Chris Blue',
          email: 'chris@example.com',
          role: 'moderator',
          status: 'active',
          createdAt: '2024-01-07T00:00:00.000Z',
          lastActiveAt: 'invalid-date',
        },
        {
          id: 'user-4',
          name: 'Dora Violet',
          email: 'dora@example.com',
          role: 'venueOwner',
          status: 'inactive',
          createdAt: '2024-02-01T00:00:00.000Z',
          lastActiveAt: '2024-03-10T12:00:00Z',
        },
        {
          id: 'user-5',
          name: 'Evan Amber',
          email: 'evan@example.com',
          role: 'contentEditor',
          status: 'active',
          createdAt: '2023-12-01T00:00:00.000Z',
          lastActiveAt: '2024-03-05T12:00:00Z',
        },
        {
          id: 'user-6',
          name: 'Faye Indigo',
          email: 'faye@example.com',
          role: 'superAdmin',
          status: 'inactive',
          createdAt: '2023-07-01T00:00:00.000Z',
          lastActiveAt: '2023-11-10T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 6,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(responseData));

    render(<UserManagementTable currentUserId="admin-1" currentUserRole="admin" />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByText('Loading users...')).not.toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?page=1&limit=20');

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(7);

    const aliceRow = screen.getByTestId('user-row-user-1');
    expect(within(aliceRow).getByText('Alice Green')).toBeInTheDocument();
    expect(within(aliceRow).getByText('alice@example.com')).toBeInTheDocument();
    expect(within(aliceRow).getByText('Editor')).toBeInTheDocument();
    expect(within(aliceRow).getByText('Active')).toBeInTheDocument();
    expect(within(aliceRow).getByText('1h ago')).toBeInTheDocument();

    const bobRow = screen.getByTestId('user-row-user-2');
    expect(within(bobRow).getByText('No name')).toBeInTheDocument();
    expect(within(bobRow).getByText('Never')).toBeInTheDocument();
    expect(within(bobRow).getByText('Inactive')).toBeInTheDocument();

    const chrisRow = screen.getByTestId('user-row-user-3');
    expect(within(chrisRow).getByText('Unknown')).toBeInTheDocument();

    const doraRow = screen.getByTestId('user-row-user-4');
    expect(within(doraRow).getByText('Just now')).toBeInTheDocument();

    const evanRow = screen.getByTestId('user-row-user-5');
    expect(within(evanRow).getByText('5d ago')).toBeInTheDocument();

    const fayeRow = screen.getByTestId('user-row-user-6');
    expect(within(fayeRow).getByText('4mo ago')).toBeInTheDocument();

    expect(screen.getByText('6 users total')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.tagName === 'P' && element.textContent?.replace(/\s+/g, ' ').includes('Showing page 1 of 2'),
      ),
    ).toBeInTheDocument();
  });

  it('allows a super admin to update another user role and clears feedback after timeout', async () => {
    jest.useFakeTimers();

    const firstResponse: MockResponse = {
      users: [
        {
          id: 'user-5',
          name: 'Dana Cyan',
          email: 'dana@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(firstResponse));
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response),
    );
    fetchMock.mockResolvedValueOnce(await buildResponse(firstResponse));

    render(<UserManagementTable currentUserId="super-1" currentUserRole="superAdmin" />);

    await waitFor(() => expect(screen.getByTestId('user-row-user-5')).toBeInTheDocument());

    const roleSelect = within(screen.getByTestId('user-row-user-5')).getByDisplayValue('Admin');
    await act(async () => {
      fireEvent.change(roleSelect, { target: { value: 'editor' } });
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1]).toMatchObject([
      '/api/admin/users',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ userId: 'user-5', role: 'editor' }),
      }),
    ]);

    expect(await screen.findByText('User role updated to editor')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(screen.queryByText('User role updated to editor')).not.toBeInTheDocument());
  });

  it('shows a helpful message when updating a user role fails', async () => {
    const response: MockResponse = {
      users: [
        {
          id: 'role-error',
          name: 'Role Error',
          email: 'role@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(response));
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Role update failed' }),
      } as Response),
    );

    render(<UserManagementTable currentUserId="super-admin" currentUserRole="superAdmin" />);

    await waitFor(() => expect(screen.getByTestId('user-row-role-error')).toBeInTheDocument());

    const select = within(screen.getByTestId('user-row-role-error')).getByDisplayValue('User');
    fireEvent.change(select, { target: { value: 'editor' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Role update failed')).toBeInTheDocument();
  });

  it('falls back to a default message when role updates reject', async () => {
    const response: MockResponse = {
      users: [
        {
          id: 'role-network',
          name: 'Role Network',
          email: 'network@example.com',
          role: 'user',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(response));
    fetchMock.mockRejectedValueOnce('Network disconnect');

    render(<UserManagementTable currentUserId="super-admin" currentUserRole="superAdmin" />);

    await waitFor(() => expect(screen.getByTestId('user-row-role-network')).toBeInTheDocument());

    const select = within(screen.getByTestId('user-row-role-network')).getByDisplayValue('User');
    fireEvent.change(select, { target: { value: 'editor' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Failed to update user role')).toBeInTheDocument();
  });

  it('prevents a super admin from demoting their own role', async () => {
    const response: MockResponse = {
      users: [
        {
          id: 'super-1',
          name: 'Super Admin',
          email: 'super@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(response));

    render(<UserManagementTable currentUserId="super-1" currentUserRole="superAdmin" />);

    await waitFor(() => expect(screen.getByTestId('user-row-super-1')).toBeInTheDocument());

    const ownRoleSelect = within(screen.getByTestId('user-row-super-1')).getByDisplayValue('Admin');
    fireEvent.change(ownRoleSelect, { target: { value: 'editor' } });

    expect(await screen.findByText('Cannot change your own Super Admin role')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('toggles user status and disables controls for the current user', async () => {
    jest.useFakeTimers();

    const response: MockResponse = {
      users: [
        {
          id: 'current-user',
          name: 'Current User',
          email: 'current@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
        {
          id: 'other-user',
          name: 'Other User',
          email: 'other@example.com',
          role: 'user',
          status: 'inactive',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
        {
          id: 'active-peer',
          name: 'Active Peer',
          email: 'peer@example.com',
          role: 'moderator',
          status: 'active',
          createdAt: '2024-01-02T00:00:00.000Z',
          lastActiveAt: '2024-03-02T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(response));
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response),
    );
    fetchMock.mockResolvedValueOnce(await buildResponse(response));
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response),
    );
    fetchMock.mockResolvedValueOnce(await buildResponse(response));

    render(<UserManagementTable currentUserId="current-user" currentUserRole="admin" />);

    await waitFor(() => expect(screen.getByTestId('user-row-other-user')).toBeInTheDocument());

    const ownRow = screen.getByTestId('user-row-current-user');
    const ownToggle = within(ownRow).getByRole('button', { name: /deactivate/i });
    expect(ownToggle).toBeDisabled();

    const otherRow = screen.getByTestId('user-row-other-user');
    const activateButton = within(otherRow).getByRole('button', { name: /activate/i });

    const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });
    await act(async () => {
      await user.click(activateButton);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1]).toMatchObject([
      '/api/admin/users',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ userId: 'other-user', status: 'active' }),
      }),
    ]);

    expect(await screen.findByRole('status')).toHaveTextContent('User activated successfully');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    const activePeerRow = screen.getByTestId('user-row-active-peer');
    const deactivateButton = within(activePeerRow).getByRole('button', { name: /deactivate/i });

    await act(async () => {
      await user.click(deactivateButton);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    expect(fetchMock.mock.calls[3]).toMatchObject([
      '/api/admin/users',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ userId: 'active-peer', status: 'inactive' }),
      }),
    ]);

    expect(await screen.findByRole('status')).toHaveTextContent('User deactivated successfully');

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('surfaces API errors when status updates fail', async () => {
    const response: MockResponse = {
      users: [
        {
          id: 'status-error',
          name: 'Status Error',
          email: 'status@example.com',
          role: 'editor',
          status: 'inactive',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(response));
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Status update failed' }),
      } as Response),
    );

    render(<UserManagementTable currentUserId="admin-1" currentUserRole="admin" />);

    await waitFor(() => expect(screen.getByTestId('user-row-status-error')).toBeInTheDocument());

    const activateButton = within(screen.getByTestId('user-row-status-error')).getByRole('button', { name: /activate/i });
    fireEvent.click(activateButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('status')).toHaveTextContent('Status update failed');
  });

  it('shows a default fallback message when status updates reject', async () => {
    const response: MockResponse = {
      users: [
        {
          id: 'status-network',
          name: 'Status Network',
          email: 'statusnet@example.com',
          role: 'editor',
          status: 'inactive',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockResolvedValueOnce(await buildResponse(response));
    fetchMock.mockRejectedValueOnce('status reject');

    render(<UserManagementTable currentUserId="admin-1" currentUserRole="admin" />);

    await waitFor(() => expect(screen.getByTestId('user-row-status-network')).toBeInTheDocument());

    const activateButton = within(screen.getByTestId('user-row-status-network')).getByRole('button', { name: /activate/i });
    fireEvent.click(activateButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('status')).toHaveTextContent('Failed to update user status');
  });

  it('renders error state when user fetching fails and shows empty results when no users', async () => {
    fetchMock.mockResolvedValueOnce(
      Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Something went wrong' }),
      } as Response),
    );

    render(<UserManagementTable currentUserId="admin-1" currentUserRole="admin" />);

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(
      await buildResponse({
        users: [],
        pagination: {
          page: 1,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }),
    );

    render(<UserManagementTable currentUserId="admin-1" currentUserRole="superAdmin" />);

    await waitFor(() => expect(screen.getByText('No users found matching the current filters.')).toBeInTheDocument());
  });

  it('refetches data when search and role filters change', async () => {
    const searchResponse: MockResponse = {
      users: [
        {
          id: 'match-user',
          name: 'Matched User',
          email: 'match@example.com',
          role: 'editor',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          lastActiveAt: '2024-03-01T12:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('search=Eco') || url.includes('role=editor')) {
        return buildResponse(searchResponse);
      }
      return buildResponse({
        users: [],
        pagination: {
          page: 1,
          totalCount: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    render(<UserManagementTable currentUserId="admin-1" currentUserRole="superAdmin" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?page=1&limit=20'));

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'Eco' } });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?page=1&limit=20&search=Eco'));

    const roleFilter = screen.getByLabelText('Filter by role', { selector: 'select' });
    fireEvent.change(roleFilter, { target: { value: 'editor' } });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?page=1&limit=20&search=Eco&role=editor'),
    );

    await waitFor(() => expect(screen.getByText('Matched User')).toBeInTheDocument());
  });

  it('supports navigating pagination controls on both mobile and desktop variants', async () => {
    jest.useFakeTimers();

    const pageResponses: Record<number, MockResponse> = {
      1: {
        users: [
          {
            id: 'page-1-user',
            name: 'Page 1 User',
            email: 'page1@example.com',
            role: 'user',
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
            lastActiveAt: '2024-03-01T12:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          totalCount: 3,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
      2: {
        users: [
          {
            id: 'page-2-user',
            name: 'Page 2 User',
            email: 'page2@example.com',
            role: 'editor',
            status: 'inactive',
            createdAt: '2024-01-02T00:00:00.000Z',
            lastActiveAt: '2024-03-02T12:00:00Z',
          },
        ],
        pagination: {
          page: 2,
          totalCount: 3,
          totalPages: 3,
          hasNextPage: true,
          hasPrevPage: true,
        },
      },
      3: {
        users: [
          {
            id: 'page-3-user',
            name: 'Page 3 User',
            email: 'page3@example.com',
            role: 'moderator',
            status: 'active',
            createdAt: '2024-01-03T00:00:00.000Z',
            lastActiveAt: '2024-03-03T12:00:00Z',
          },
        ],
        pagination: {
          page: 3,
          totalCount: 3,
          totalPages: 3,
          hasNextPage: false,
          hasPrevPage: true,
        },
      },
    };

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = new URL(String(input), 'http://localhost');
      const page = Number(url.searchParams.get('page') ?? '1');
      const response = pageResponses[page] ?? pageResponses[1];
      const clone = JSON.parse(JSON.stringify(response)) as MockResponse;
      return buildResponse(clone);
    });

    render(<UserManagementTable currentUserId="admin-1" currentUserRole="superAdmin" />);

    await waitFor(() => expect(screen.getByText('Page 1 User')).toBeInTheDocument());

    const mobileNext = screen.getAllByRole('button', { name: 'Next' })[0];
    await act(async () => {
      fireEvent.click(mobileNext);
    });
    expect(await screen.findByText('Page 2 User')).toBeInTheDocument();

    const mobilePrevious = screen.getAllByRole('button', { name: 'Previous' })[0];
    await act(async () => {
      fireEvent.click(mobilePrevious);
    });
    expect(await screen.findByText('Page 1 User')).toBeInTheDocument();

    let desktopNav = screen.getByLabelText('Pagination');
    const desktopNext = within(desktopNav).getByRole('button', { name: /Next/ });
    await act(async () => {
      fireEvent.click(desktopNext);
    });
    expect(await screen.findByText('Page 2 User')).toBeInTheDocument();

    desktopNav = screen.getByLabelText('Pagination');
    const desktopPrevious = within(desktopNav).getByRole('button', { name: /Previous/ });
    await act(async () => {
      fireEvent.click(desktopPrevious);
    });
    expect(await screen.findByText('Page 1 User')).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?page=1&limit=20');
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?page=2&limit=20');

    act(() => {
      jest.advanceTimersByTime(0);
    });
  });
});
