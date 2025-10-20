import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementTable } from '../UserManagementTable';

describe('UserManagementTable', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockRestore?.();
    global.fetch = originalFetch;
  });

  const buildUsersResponse = (overrides?: Partial<ReturnType<typeof createUser>>) => ({
    users: [
      createUser({ id: 'user-1', name: 'Alice Admin', email: 'alice@example.com', role: 'admin' }),
      createUser({ id: 'user-2', name: 'Bob Owner', email: 'bob@example.com', role: 'venueOwner', status: 'inactive' }),
    ].map((user, index) => (index === 1 && overrides ? { ...user, ...overrides } : user)),
    pagination: {
      page: 1,
      limit: 20,
      totalCount: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    filters: {
      search: '',
      role: null,
    },
  });

  const fetchMock = () => global.fetch as jest.Mock;

  const queueFetchResponses = (...responses: Array<{ ok: boolean; json: () => Promise<unknown> }>) => {
    fetchMock().mockImplementation(() => {
      const next = responses.shift();
      if (!next) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve(next);
    });
  };

  it('loads and renders users for super admins', async () => {
    queueFetchResponses({
      ok: true,
      json: async () => buildUsersResponse(),
    });

    render(
      <UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />,
    );

    const adminRow = await screen.findByTestId('user-row-user-1');
    expect(adminRow).toBeInTheDocument();
    expect(within(adminRow).getByRole('combobox')).toHaveValue('admin');
    expect(screen.getByText('2 users total')).toBeInTheDocument();
  });

  it('allows super admins to change user roles and refreshes the table', async () => {
    queueFetchResponses(
      {
        ok: true,
        json: async () => buildUsersResponse(),
      },
      {
        ok: true,
        json: async () => ({ success: true }),
      },
      {
        ok: true,
        json: async () => buildUsersResponse({ role: 'editor' }),
      },
    );

    render(
      <UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />,
    );
    const user = userEvent.setup();

    const adminRow = await screen.findByTestId('user-row-user-1');
    const select = within(adminRow).getByRole('combobox');
    await user.selectOptions(select, 'editor');

    await waitFor(() => {
      expect(fetchMock()).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ userId: 'user-1', role: 'editor' }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('User role updated to editor')).toBeInTheDocument();
    });
  });

  it('toggles user status via the actions column', async () => {
    queueFetchResponses(
      {
        ok: true,
        json: async () => buildUsersResponse(),
      },
      {
        ok: true,
        json: async () => ({ success: true }),
      },
      {
        ok: true,
        json: async () => buildUsersResponse({
          status: 'active',
        }),
      },
    );

    render(
      <UserManagementTable currentUserRole="superAdmin" currentUserId="super-1" />,
    );
    const user = userEvent.setup();

    const ownerRow = await screen.findByTestId('user-row-user-2');
    const toggle = within(ownerRow).getByRole('button', { name: /activate/i });
    await user.click(toggle);

    await waitFor(() => {
      expect(fetchMock()).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ userId: 'user-2', status: 'active' }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/activated successfully/i)).toBeInTheDocument();
    });
  });

  it('prevents non-super admins from changing roles', async () => {
    queueFetchResponses({
      ok: true,
      json: async () => buildUsersResponse(),
    });

    render(
      <UserManagementTable currentUserRole="admin" currentUserId="admin-1" />,
    );

    const adminRow = await screen.findByTestId('user-row-user-1');
    expect(within(adminRow).queryByRole('combobox')).toBeNull();

    const feedback = screen.queryByRole('status');
    expect(feedback).toBeNull();
  });
});

function createUser({
  id,
  name,
  email,
  role,
  status = 'active',
}: {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: 'active' | 'inactive';
}) {
  return {
    id,
    name,
    email,
    role,
    status,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
}
