import { render, screen } from '@testing-library/react';

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
  usePathname: jest.fn(() => '/admin'),
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

  it.each([
    { role: 'admin' as const, id: 'user-1' },
    { role: 'superAdmin' as const, id: 'user-2' },
  ])('renders navigation for admin and super admin users (role: $role)', async ({ role, id }) => {
    mockAuth.mockResolvedValue({
      user: { id, role },
    });

    const shell = await AdminShell({ children: <div data-testid="layout-child">Child</div> });
    render(shell);
    expect(await screen.findByText('Admin Panel', undefined, { timeout: 750 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: /back to site/i })).toHaveAttribute('href', '/');
    expect(screen.getByTestId('layout-child')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects non-admin users to the forbidden page', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-3', role: 'user' },
    });
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    await expect(AdminShell({ children: <div /> })).rejects.toThrow('redirect');
    expect(redirectMock).toHaveBeenCalledWith('/unauthorized');
  });
});
