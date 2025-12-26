import { act, render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="header" />,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer" />,
}));

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
  usePathname: jest.fn(() => '/admin/dashboard'),
}));

const mockAuth = jest.requireMock('@/lib/auth').auth as jest.Mock;

describe('Admin layout', () => {
  let AdminLayout: typeof import('../layout').default;
  let AdminShell: typeof import('../layout').AdminShell;

  beforeEach(async () => {
    jest.clearAllMocks();
    const layoutModule = await import('../layout');
    AdminLayout = layoutModule.default;
    AdminShell = layoutModule.AdminShell;
  });

  it('renders navigation for admin and super admin users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'admin' },
    });

    const shell = await AdminShell({ children: <div data-testid="layout-child">Child</div> });
    await act(async () => {
      render(shell);
    });
    expect(await screen.findByText('Admin Panel', undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      '/admin/dashboard'
    );
    expect(screen.getByRole('link', { name: /back to site/i })).toHaveAttribute('href', '/');
    expect(screen.getByTestId('layout-child')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects non-admin users to the forbidden page', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-2', role: 'user' },
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    await expect(AdminShell({ children: <div /> })).rejects.toThrow('redirect');
    expect(redirectMock).toHaveBeenCalledWith('/403');
  });
});
