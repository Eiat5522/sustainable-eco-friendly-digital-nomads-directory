import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.Mock;
const mockRedirect = jest.requireMock('next/navigation').redirect as jest.Mock;

describe('Admin layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation for admin and super admin users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'admin' },
    });
    const AdminLayout = (await import('../layout')).default;

    render(await AdminLayout({ children: <div data-testid="layout-child">Child</div> }));

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      '/admin/dashboard'
    );
    expect(screen.getByTestId('layout-child')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects non-admin users to the login page', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-2', role: 'user' },
    });
    mockRedirect.mockImplementation(() => {
      throw new Error('redirect');
    });

    const AdminLayout = (await import('../layout')).default;

    await expect(AdminLayout({ children: <div /> })).rejects.toThrow('redirect');
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });
});
