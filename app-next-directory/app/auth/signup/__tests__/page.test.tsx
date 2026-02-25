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

jest.mock('../SignupPageContent', () => ({
  __esModule: true,
  default: () => <div data-testid="signup-content" />,
}));

jest.mock('@/components/layout/HeaderServer', () => ({
  HeaderServer: () => <header data-testid="signup-header" />,
}));

jest.mock('@/components/layout/FooterServer', () => ({
  FooterServer: () => <footer data-testid="signup-footer" />,
}));

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const authMock = jest.requireMock('@/lib/auth').auth as jest.Mock;
const getBaseUrlMock = jest.requireMock('@/lib/absolute-url').getBaseUrl as jest.Mock;
const sanitizeCallbackUrlMock = jest.requireMock('@/lib/auth/callbackUrl')
  .sanitizeCallbackUrl as jest.Mock;

describe('SignupPage (server)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects authenticated users to sanitized callback urls', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    getBaseUrlMock.mockResolvedValueOnce('https://example.com');
    sanitizeCallbackUrlMock.mockReturnValueOnce('/dashboard');
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const SignupPage = (await import('../page')).default;

    await expect(
      SignupPage({ searchParams: Promise.resolve({ callbackUrl: '/dashboard' }) })
    ).rejects.toThrow('redirect');

    expect(getBaseUrlMock).toHaveBeenCalledTimes(1);
    expect(sanitizeCallbackUrlMock).toHaveBeenCalledWith('/dashboard', 'https://example.com');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('handles base url resolution failures gracefully', async () => {
    authMock.mockResolvedValueOnce({ user: { id: 'user-2' } });
    getBaseUrlMock.mockRejectedValueOnce(new Error('failed'));
    sanitizeCallbackUrlMock.mockReturnValueOnce('/fallback');
    redirectMock.mockImplementation(() => {
      throw new Error('redirect');
    });

    const SignupPage = (await import('../page')).default;

    await expect(
      SignupPage({ searchParams: Promise.resolve({ callbackUrl: '/account' }) })
    ).rejects.toThrow('redirect');

    expect(sanitizeCallbackUrlMock).toHaveBeenCalledWith('/account', undefined);
    expect(redirectMock).toHaveBeenCalledWith('/fallback');
  });

  it('renders the signup page content for guests', async () => {
    authMock.mockResolvedValueOnce(null);

    const SignupPage = (await import('../page')).default;
    const element = await SignupPage({});
    render(element);

    expect(screen.getByTestId('signup-header')).toBeInTheDocument();
    expect(screen.getByTestId('signup-content')).toBeInTheDocument();
    expect(screen.getByTestId('signup-footer')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
