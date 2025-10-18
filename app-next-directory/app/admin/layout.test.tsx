import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const { redirect } = jest.requireMock('next/navigation') as { redirect: jest.Mock };
const { auth } = jest.requireMock('@/lib/auth') as { auth: jest.Mock };

describe('AdminLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redirect.mockImplementation(() => {
      throw new Error('redirect called');
    });
  });

  it('redirects non-admin users to the login page', async () => {
    auth.mockResolvedValueOnce({ user: { role: 'user' } });

    const { default: AdminLayout } = await import('./layout');

    await expect(AdminLayout({ children: <div /> })).rejects.toThrow('redirect called');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('renders navigation for admin users', async () => {
    auth.mockResolvedValueOnce({ user: { id: '1', role: 'superAdmin' } });

    const { default: AdminLayout } = await import('./layout');

    const element = await AdminLayout({ children: <div data-testid="content">child</div> });
    render(element);

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('👑 Super Admin')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/admin/dashboard', '/admin/users', '/listings']));
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('shows the admin badge for standard admins', async () => {
    auth.mockResolvedValueOnce({ user: { id: '2', role: 'admin' } });

    const { default: AdminLayout } = await import('./layout');

    const element = await AdminLayout({ children: <div>child</div> });
    render(element);

    expect(screen.getByText('🔧 Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });
});
