import { render, screen } from '@testing-library/react';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/absolute-url', () => ({
  getBaseUrl: jest.fn(),
}));

jest.mock('@/lib/auth/callbackUrl', () => ({
  sanitizeCallbackUrl: jest.fn((url: string | undefined) => url ?? null),
}));

jest.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="mock-header" />,
}));

jest.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="mock-footer" />,
}));

jest.mock('@/components/auth/SocialAuthRow', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-social-row" />,
}));

const redirectMock = jest.fn();
const routerReplaceMock = jest.fn();
const useRouterMock = jest.fn(() => ({ replace: routerReplaceMock }));
const useSearchParamsMock = jest.fn(() => ({ get: () => null }));

jest.mock('next/navigation', () => ({
  useRouter: () => useRouterMock(),
  useSearchParams: () => useSearchParamsMock(),
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const authMock = jest.requireMock('@/lib/auth').auth as jest.Mock;
const sanitizeCallbackUrlMock = jest.requireMock('@/lib/auth/callbackUrl')
  .sanitizeCallbackUrl as jest.Mock;
const getBaseUrlMock = jest.requireMock('@/lib/absolute-url').getBaseUrl as jest.Mock;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects authenticated users to the sanitized callback url', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    getBaseUrlMock.mockResolvedValueOnce('https://example.com');
    sanitizeCallbackUrlMock.mockReturnValue('/dashboard');
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const LoginPage = (await import('../page')).default;
    await expect(LoginPage({ searchParams: Promise.resolve({ callbackUrl: '/dashboard' }) })).rejects.toThrow(
      'redirect'
    );
    expect(sanitizeCallbackUrlMock).toHaveBeenCalledWith('/dashboard', 'https://example.com');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('handles getBaseUrl errors gracefully', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    getBaseUrlMock.mockRejectedValueOnce(new Error('Base URL error'));
    sanitizeCallbackUrlMock.mockReturnValue('/fallback');
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const LoginPage = (await import('../page')).default;
    await expect(LoginPage({ searchParams: Promise.resolve({ callbackUrl: '/dashboard' }) })).rejects.toThrow(
      'redirect'
    );
    expect(sanitizeCallbackUrlMock).toHaveBeenCalledWith('/dashboard', undefined);
    expect(redirectMock).toHaveBeenCalledWith('/fallback');
  });

  it('handles missing searchParams', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    getBaseUrlMock.mockResolvedValueOnce('https://example.com');
    sanitizeCallbackUrlMock.mockReturnValue('/');
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const LoginPage = (await import('../page')).default;
    await expect(LoginPage({})).rejects.toThrow('redirect');
    expect(sanitizeCallbackUrlMock).toHaveBeenCalledWith(undefined, 'https://example.com');
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('renders the login form layout for unauthenticated users', async () => {
    authMock.mockResolvedValueOnce(null);

    const LoginPage = (await import('../page')).default;
    const element = await LoginPage({ searchParams: Promise.resolve({ callbackUrl: '/welcome' }) });
    render(element);

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-social-row')).toHaveLength(3);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
