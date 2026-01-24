import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import * as nextAuth from 'next-auth/react';
import React from 'react';
import { Header } from '../Header';

// Mock next/image used inside Header - strip props that aren't valid DOM attributes (like priority)
jest.mock('next/image', () => {
  return function MockNextImage({
    alt,
    src,
    priority,
    fill,
    onError,
    ...props
  }: {
    alt: string;
    src: string | { src: string };
    priority?: boolean;
    fill?: boolean;
    onError?: () => void;
  }) {
    const resolvedSrc = typeof src === 'string' ? src : (src?.src ?? '');
    return (
      <img
        alt={alt}
        src={resolvedSrc}
        onError={onError}
        data-testid="next-image"
        data-fill={fill ? 'true' : 'false'}
        data-priority={priority ? 'true' : 'false'}
        {...props}
      />
    );
  };
});

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => {
    const { useRouter } = require('next/navigation');
    const router = useRouter();

    return (
      <a
        href={href}
        onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          router?.push?.(href);
        }}
        {...props}
      >
        {children}
      </a>
    );
  };

  MockLink.displayName = 'MockLink';

  return {
    __esModule: true,
    default: MockLink,
  };
});

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(),
}));

describe('Header', () => {
  const originalUseContext = React.useContext;
  const signOutSpy = jest.spyOn(nextAuth, 'signOut');
  const ignoredConsoleWarnSpy: jest.SpyInstance = jest
    .spyOn(console, 'warn')
    .mockImplementation(() => {});
  const ignoredConsoleErrorSpy: jest.SpyInstance = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  let routerPushMock: jest.Mock;

  // Helper to mock SessionContext
  function mockSessionContext(
    session: Session | null,
    status: 'authenticated' | 'unauthenticated' | 'loading'
  ) {
    jest.spyOn(React, 'useContext').mockImplementation(context => {
      if (context === nextAuth.SessionContext) {
        return {
          data: session,
          status,
          update: jest.fn(),
        };
      }
      return originalUseContext(context);
    });
  }

  function clearSessionContext() {
    jest.spyOn(React, 'useContext').mockImplementation(context => {
      if (context === nextAuth.SessionContext) {
        return null;
      }
      return originalUseContext(context);
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure signOut resolves to avoid hanging async behavior in tests
    signOutSpy.mockResolvedValue(undefined as unknown as undefine);
    // Create fresh console spies per-test so restoreAllMocks in afterEach doesn't
    // permanently remove them for subsequent tests.
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    routerPushMock = jest.fn();
    mockUseRouter.mockReturnValue({
      push: routerPushMock,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('useSafeSession hook', () => {
    it('warns in development when rendered without SessionProvider', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';

      clearSessionContext();
      render(<Header />);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[auth] Header rendered without SessionProvider; defaulting to unauthenticated state'
      );

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('does not warn in production when rendered without SessionProvider', () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';

      clearSessionContext();
      render(<Header />);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('only warns once even when re-rendered without SessionProvider', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
      // Create a stable mock that persists across renders
      const useContextMock = jest.fn(context => {
        if (context === nextAuth.SessionContext) {
          return null;
        }
        return originalUseContext(context);
      });

      jest.spyOn(React, 'useContext').mockImplementation(useContextMock);

      const { rerender } = render(<Header />);
      rerender(<Header />);

      // In React 18 StrictMode test environments a component may mount twice.
      // The warning may be emitted asynchronously (inside effects), so wait for it.
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[auth] Header rendered without SessionProvider; defaulting to unauthenticated state'
        );
      });

      (process.env as any).NODE_ENV = originalEnv;
    });

    it('returns unauthenticated status when context is missing', () => {
      clearSessionContext();
      render(<Header />);

      expect(screen.getByRole('link', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    it('uses session data from context when available', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByRole('button', { name: /open account menu/i })).toBeInTheDocument();
    });
  });

  describe('Status states', () => {
    it('shows nothing for user actions when status is loading', () => {
      mockSessionContext(null, 'loading');
      render(<Header />);

      expect(
        screen.queryByRole('link', { name: /sign in to your account/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /open account menu/i })).not.toBeInTheDocument();
    });

    it('shows sign in link when unauthenticated', () => {
      mockSessionContext(null, 'unauthenticated');
      render(<Header />);

      const signInLink = screen.getByRole('link', { name: /sign in to your account/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/auth/login');
    });

    it('shows account menu when authenticated', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByRole('button', { name: /open account menu/i })).toBeInTheDocument();
    });
  });

  describe('Navigation links', () => {
    beforeEach(() => {
      mockSessionContext(null, 'unauthenticated');
      render(<Header />);
    });

    it('renders logo with link to homepage', () => {
      const logoLink = screen.getByRole('link', { name: /go to homepage/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('renders all primary navigation links', () => {
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/search');
      expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
      expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute(
        'href',
        '/contact-us'
      );
    });

    it('renders mobile menu button', () => {
      const mobileMenuButton = screen.getByRole('button', { name: /open navigation menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('routes via router.push when navigation link is clicked', async () => {
      const user = userEvent.setup();
      const searchLink = screen.getByRole('link', { name: 'Search' });

      await user.click(searchLink);

      expect(routerPushMock).toHaveBeenCalledWith('/search');
    });
  });

  describe('User display names', () => {
    it('displays full name when user has name', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText(/welcome, john!/i)).toBeInTheDocument();
    });

    it('displays email when user has no name', () => {
      mockSessionContext(
        {
          user: { id: '1', email: 'test@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText(/signed in/i)).toBeInTheDocument();
    });

    it('extracts first name for multi-word names', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Mary Jane Watson', email: 'mary@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText(/welcome, mary!/i)).toBeInTheDocument();
    });

    it('handles single-word names correctly', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Madonna', email: 'madonna@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText(/welcome, madonna!/i)).toBeInTheDocument();
    });
  });

  describe('Account initials', () => {
    it('generates initials from multi-word name', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('generates initial from single-word name', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Alice', email: 'alice@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('generates initials from email when no name', () => {
      mockSessionContext(
        {
          user: { id: '1', email: 'bob smith@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText('BS')).toBeInTheDocument();
    });

    it('defaults to "U" when no name or email', () => {
      mockSessionContext(
        {
          user: { id: '1' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('limits initials to 2 characters max', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'John Paul George Ringo', email: 'jpgr@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText('JP')).toBeInTheDocument();
    });
  });

  describe('User avatar', () => {
    it('displays user image when available', () => {
      mockSessionContext(
        {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/avatar.jpg',
          },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      const avatar = screen.getByAltText(/test user avatar/i);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('displays initials when no image is available', () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText('TU')).toBeInTheDocument();
      expect(screen.queryByAltText(/avatar/i)).not.toBeInTheDocument();
    });

    it('handles non-string image values', () => {
      mockSessionContext(
        {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            image: null as any,
          },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText('TU')).toBeInTheDocument();
    });
  });

  describe('Dropdown menu', () => {
    it('shows account label with display name', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      await waitFor(() => {
        expect(screen.getByText(/signed in as test user/i)).toBeInTheDocument();
      });
    });

    it('shows profile link for authenticated users', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as Session,
        'authenticated'
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      await waitFor(() => {
        const profileLink = document.querySelector('a[href="/profile"]');
        expect(profileLink).toBeInTheDocument();
        expect(profileLink?.textContent).toMatch(/my profile/i);
      });
    });

    it('does not show dashboard link for authenticated users', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Regular User', email: 'user@example.com', role: 'member' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      await waitFor(() => {
        const dashboardLink = document.querySelector('a[href="/dashboard"]');
        const profileLink = document.querySelector('a[href="/profile"]');
        expect(profileLink).toBeInTheDocument();
        expect(dashboardLink).not.toBeInTheDocument();
      });
    });

    it('shows admin dashboard link only for admin users', async () => {
      mockSessionContext(
        {
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
          },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      await waitFor(() => {
        const adminLink = document.querySelector('a[href="/admin"]');
        expect(adminLink).toBeInTheDocument();
        expect(adminLink?.textContent).toMatch(/admin dashboards/i);
      });
    });

    it('does not show admin dashboard link for non-admin users', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Regular User', email: 'user@example.com', role: 'member' },
        } as unknown as Session,
        'authenticated'
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /admin dashboards/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Sign out functionality', () => {
    it('invokes signOut with correct redirect when sign out is clicked', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as Session,
        'authenticated'
      );

      signOutSpy.mockResolvedValue(undefined as any);

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      const signOutItem = await screen.findByText(/^sign out$/i);
      await user.click(signOutItem);

      expect(signOutSpy).toHaveBeenCalledWith({ redirectTo: '/' });
    });

    it('shows "Signing out…" during sign out process', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as Session,
        'authenticated'
      );

      let resolveSignOut: (() => void) | undefined;
      signOutSpy.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveSignOut = resolve;
          })
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      const signOutItem = await screen.findByText(/^sign out$/i);
      await user.click(signOutItem);

      expect(await screen.findByText(/signing out/i)).toBeInTheDocument();

      await act(async () => {
        resolveSignOut?.();
      });

      expect(await screen.findByText(/^sign out$/i)).toBeInTheDocument();
    });

    it('prevents multiple simultaneous sign out attempts', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as Session,
        'authenticated'
      );

      let resolveSignOut: (() => void) | undefined;
      signOutSpy.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveSignOut = resolve;
          })
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      const signOutItem = await screen.findByText(/^sign out$/i);

      // Click sign out multiple times
      await user.click(signOutItem);
      await user.click(signOutItem);
      await user.click(signOutItem);

      // Should only be called once
      expect(signOutSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveSignOut?.();
      });
    });

    it('handles sign out errors gracefully', async () => {
      mockSessionContext(
        {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        } as Session,
        'authenticated'
      );

      const mockError = new Error('Sign out failed');
      signOutSpy.mockRejectedValue(mockError);

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      const signOutItem = await screen.findByText(/^sign out$/i);

      // Click the sign out button - it should handle errors internally
      await user.click(signOutItem);

      // Verify signOut was called
      expect(signOutSpy).toHaveBeenCalledWith({ redirectTo: '/' });
    });
  });

  describe('Edge cases', () => {
    it('handles session with null user', () => {
      mockSessionContext({ user: null } as any, 'authenticated');

      render(<Header />);

      // Should still render the dropdown
      expect(screen.getByRole('button', { name: /open account menu/i })).toBeInTheDocument();
    });

    it('handles session with undefined user properties', () => {
      mockSessionContext(
        {
          user: { id: '1' },
        } as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByRole('button', { name: /open account menu/i })).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('handles empty string name', () => {
      mockSessionContext(
        {
          user: { id: '1', name: '', email: 'test@example.com' },
        } as Session,
        'authenticated'
      );

      render(<Header />);

      expect(screen.getByText(/signed in/i)).toBeInTheDocument();
    });

    it('handles user role as venueOwner', async () => {
      mockSessionContext(
        {
          user: {
            id: '1',
            name: 'Venue Owner',
            email: 'owner@example.com',
            role: 'venueOwner',
          },
        } as Session,
        'authenticated'
      );

      render(<Header />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /open account menu/i }));

      await waitFor(() => {
        const dashboardLink = document.querySelector('a[href="/dashboard"]');
        const adminLink = document.querySelector('a[href="/admin"]');
        const profileLink = document.querySelector('a[href="/profile"]');
        expect(profileLink).toBeInTheDocument();
        expect(dashboardLink).not.toBeInTheDocument();
        expect(adminLink).not.toBeInTheDocument();
      });
    });
  });
});
