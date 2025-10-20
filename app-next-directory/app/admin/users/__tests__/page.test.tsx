import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const userTableMock = jest.fn();

jest.mock('../UserManagementTable', () => ({
  UserManagementTable: (props: unknown) => {
    userTableMock(props);
    return <div data-testid="user-management-table" />;
  },
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.MockedFunction<() => Promise<{ user?: unknown } | null>>;

describe('Admin users page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the user management interface for admins', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'admin-1', role: 'superAdmin' },
    });

    const AdminUsersPage = (await import('../page')).default;
    const element = await AdminUsersPage();
    render(<>{element}</>);

    expect(screen.getByTestId('admin-users-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-users-title')).toHaveTextContent('User Management');
    expect(screen.getByTestId('user-management-table')).toBeInTheDocument();
    expect(userTableMock).toHaveBeenCalledWith({ currentUserRole: 'superAdmin', currentUserId: 'admin-1' });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects when the viewer is not an admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-99', role: 'user' },
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const AdminUsersPage = (await import('../page')).default;

    await expect(AdminUsersPage()).rejects.toThrow('redirect');
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?callbackUrl=/admin/users');
  });
});
