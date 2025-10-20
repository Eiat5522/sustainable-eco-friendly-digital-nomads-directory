import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.Mock;

describe('Admin layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation for admin and super admin users', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1', role: 'admin' },
    });
    const AdminLayout = (await import('../layout')).default;

    const tree = await AdminLayout({ children: <div data-testid="layout-child">Child</div> });
    render(<>{tree}</>);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByTestId('layout-child')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects non-admin users to the login page', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-2', role: 'user' },
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const AdminLayout = (await import('../layout')).default;

    await expect(
      AdminLayout({ children: <div /> }),
    ).rejects.toThrow('redirect');
    expect(redirectMock).toHaveBeenCalledWith('/auth/login');
  });
});
