import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
const mockAuth = jest.fn();
const mockRedirect = jest.fn();
const mockGetBaseUrl = jest.fn();
const mockSanitizeCallbackUrl = jest.fn();

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: mockAuth,
}));

jest.mock('next/navigation', () => ({
  __esModule: true,
  redirect: mockRedirect,
}));

jest.mock('@/lib/absolute-url', () => ({
  __esModule: true,
  getBaseUrl: mockGetBaseUrl,
}));

jest.mock('@/lib/auth/callbackUrl', () => ({
  __esModule: true,
  sanitizeCallbackUrl: mockSanitizeCallbackUrl,
}));

// Mock child components
jest.mock('../LoginForm', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/auth/SocialAuthRow', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/layout/Header', () => ({
  __esModule: true,
  Header: () => null,
}));

jest.mock('@/components/layout/Footer', () => ({
  __esModule: true,
  Footer: () => null,
}));

jest.mock('@/components/ui/neo-card', () => ({
  __esModule: true,
  NeoCard: () => null,
  NeoCardContent: () => null,
  NeoCardHeader: () => null,
  NeoCardTitle: () => null,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: () => null,
}));

type LoginPageModule = typeof import('../page');

describe('LoginPage', () => {
  let LoginPage: LoginPageModule['default'];

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockGetBaseUrl.mockResolvedValue('https://example.com');
    mockSanitizeCallbackUrl.mockReturnValue('/');
    mockRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    // Dynamic import after mocks are set
    const module = await import('../page');
    LoginPage = module.default;
  });

  describe('Unauthenticated user', () => {
    it('does not redirect when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await LoginPage({});

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('checks authentication status', async () => {
      mockAuth.mockResolvedValue(null);

      await LoginPage({});

      expect(mockAuth).toHaveBeenCalled();
    });

    it('does not attempt to get base URL when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await LoginPage({});

      expect(mockGetBaseUrl).not.toHaveBeenCalled();
    });

    it('does not sanitize callback URL when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await LoginPage({});

      expect(mockSanitizeCallbackUrl).not.toHaveBeenCalled();
    });

    it('handles search params as undefined', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(LoginPage({ searchParams: undefined })).resolves.not.toThrow();
    });

    it('handles empty search params', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(LoginPage({ searchParams: {} })).resolves.not.toThrow();
    });
  });

  describe('Authenticated user', () => {
    it('redirects authenticated users to home page', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockSanitizeCallbackUrl.mockReturnValue('/');

      await expect(LoginPage({})).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('redirects to callback URL when provided', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockSanitizeCallbackUrl.mockReturnValue('/dashboard');

      await expect(
        LoginPage({
          searchParams: { callbackUrl: '/dashboard' },
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(
        '/dashboard',
        'https://example.com'
      );
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });

    it('redirects to home when callback URL is sanitized to null', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockSanitizeCallbackUrl.mockReturnValue(null);

      await expect(
        LoginPage({
          searchParams: { callbackUrl: 'https://evil.com' },
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('handles callback URL as array', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockSanitizeCallbackUrl.mockReturnValue('/profile');

      await expect(
        LoginPage({
          searchParams: { callbackUrl: ['/profile', '/other'] },
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(
        '/profile',
        'https://example.com'
      );
      expect(mockRedirect).toHaveBeenCalledWith('/profile');
    });

    it('calls getBaseUrl to determine origin', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetBaseUrl.mockResolvedValue('https://example.com');
      mockSanitizeCallbackUrl.mockReturnValue('/');

      await expect(LoginPage({})).rejects.toThrow('NEXT_REDIRECT');

      expect(mockGetBaseUrl).toHaveBeenCalled();
    });
  });

  describe('Search params handling', () => {
    it('handles search params as Promise', async () => {
      mockAuth.mockResolvedValue(null);

      const searchParamsPromise = Promise.resolve({
        callbackUrl: '/dashboard',
      });

      await expect(
        LoginPage({ searchParams: searchParamsPromise })
      ).resolves.not.toThrow();
    });

    it('extracts first callback URL from array', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockSanitizeCallbackUrl.mockReturnValue('/first');

      await expect(
        LoginPage({
          searchParams: { callbackUrl: ['/first', '/second'] },
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(
        '/first',
        expect.any(String)
      );
    });
  });

  describe('Base URL handling', () => {
    it('handles getBaseUrl rejection gracefully', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetBaseUrl.mockRejectedValue(new Error('Failed to get base URL'));
      mockSanitizeCallbackUrl.mockReturnValue('/');

      await expect(LoginPage({})).rejects.toThrow('NEXT_REDIRECT');

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(undefined, undefined);
      expect(mockRedirect).toHaveBeenCalledWith('/');
    });

    it('uses base URL from getBaseUrl for sanitization', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetBaseUrl.mockResolvedValue('https://custom.domain.com');
      mockSanitizeCallbackUrl.mockReturnValue('/profile');

      await expect(
        LoginPage({
          searchParams: { callbackUrl: '/profile' },
        })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(
        '/profile',
        'https://custom.domain.com'
      );
    });

    it('passes undefined when no callback URL provided', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetBaseUrl.mockResolvedValue('https://example.com');
      mockSanitizeCallbackUrl.mockReturnValue('/');

      await expect(LoginPage({ searchParams: {} })).rejects.toThrow('NEXT_REDIRECT');

      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(
        undefined,
        'https://example.com'
      );
    });
  });

  describe('Integration behavior', () => {
    it('performs full authentication check flow', async () => {
      mockAuth.mockResolvedValue(null);

      await LoginPage({});

      expect(mockAuth).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('performs full redirect flow for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetBaseUrl.mockResolvedValue('https://example.com');
      mockSanitizeCallbackUrl.mockReturnValue('/dashboard');

      await expect(
        LoginPage({ searchParams: { callbackUrl: '/dashboard' } })
      ).rejects.toThrow('NEXT_REDIRECT');

      expect(mockAuth).toHaveBeenCalled();
      expect(mockGetBaseUrl).toHaveBeenCalled();
      expect(mockSanitizeCallbackUrl).toHaveBeenCalledWith(
        '/dashboard',
        'https://example.com'
      );
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
    });
  });
});
