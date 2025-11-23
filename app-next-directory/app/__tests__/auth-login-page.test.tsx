import type React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/absolute-url', () => ({
  __esModule: true,
  getBaseUrl: jest.fn(),
}));

jest.mock('@/lib/auth/callbackUrl', () => ({
  __esModule: true,
  sanitizeCallbackUrl: jest.fn(),
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  Header: () => <header data-testid="header" />,
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  Footer: () => <footer data-testid="footer" />,
}));

jest.mock('@/components/auth/SocialAuthRow', () => ({
  __esModule: true,
  default: () => <div data-testid="social-auth-row" />,
}));

jest.mock('../auth/login/LoginForm', () => ({
  __esModule: true,
  default: () => <div data-testid="login-form" />,
}));

jest.mock('@/components/ui/neo-card', () => ({
  __esModule: true,
  NeoCard: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <div data-testid="neo-card" {...props}>
      {children}
    </div>
  ),
  NeoCardContent: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="neo-card-content">{children}</div>
  ),
  NeoCardHeader: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="neo-card-header">{children}</div>
  ),
  NeoCardTitle: ({ children }: { children?: React.ReactNode }) => (
    <h2 data-testid="neo-card-title">{children}</h2>
  ),
}));

import LoginPage from '../auth/login/page';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getBaseUrl } from '@/lib/absolute-url';
import { sanitizeCallbackUrl } from '@/lib/auth/callbackUrl';

describe('LoginPage', () => {
  const mockAuth = jest.mocked(auth);
  const mockGetBaseUrl = jest.mocked(getBaseUrl);
  const mockSanitizeCallbackUrl = jest.mocked(sanitizeCallbackUrl);
  const mockRedirect = jest.mocked(redirect);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects authenticated users to sanitized callback URL', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as unknown as Awaited<ReturnType<typeof auth>>);
    mockGetBaseUrl.mockResolvedValue('https://example.com');
    mockSanitizeCallbackUrl.mockReturnValue('/dashboard');

    await LoginPage({ searchParams: Promise.resolve({ callbackUrl: ['/dashboard', '/other'] }) });

    expect(mockGetBaseUrl).toHaveBeenCalledTimes(1);
    expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith('/dashboard', 'https://example.com');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('falls back to home when sanitized callback is null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } } as unknown as Awaited<ReturnType<typeof auth>>);
    mockGetBaseUrl.mockRejectedValue(new Error('network'));
    mockSanitizeCallbackUrl.mockReturnValue(null);

    await LoginPage({ searchParams: { callbackUrl: '/unsafe' } });

    expect(mockGetBaseUrl).toHaveBeenCalledTimes(1);
    expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith('/unsafe', undefined);
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('renders the login interface when no active session exists', async () => {
    mockAuth.mockResolvedValue(null as unknown as Awaited<ReturnType<typeof auth>>);

    const element = await LoginPage({});
    render(element);

    expect(mockGetBaseUrl).not.toHaveBeenCalled();
    expect(mockSanitizeCallbackUrl).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getAllByTestId('social-auth-row')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/auth/signup');
  });
});
