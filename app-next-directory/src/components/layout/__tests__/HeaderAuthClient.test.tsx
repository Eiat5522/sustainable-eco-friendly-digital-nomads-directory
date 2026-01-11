/**
 * Unit tests for HeaderAuthClient.tsx
 * Tests the client-side interactive auth component
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signOut } from 'next-auth/react';
import type { AuthUser } from '@/lib/data-access/auth.dal';
import { HeaderAuthClient } from '../HeaderAuthClient';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src, ...props }: any) =>
    require('react').createElement('img', { alt, src, ...props }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  DoorOpen: () => <span data-testid="icon-door-open" />,
  LayoutDashboard: () => <span data-testid="icon-dashboard" />,
  User: () => <span data-testid="icon-user" />,
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('HeaderAuthClient', () => {
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'John Doe',
    image: 'https://example.com/avatar.jpg',
    role: 'user',
  };

  const mockDisplayInfo = {
    displayName: 'John Doe',
    shortName: 'John',
    initials: 'JD',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Unauthenticated state', () => {
    it('should render sign-in button when not authenticated', () => {
      render(
        <HeaderAuthClient isAuthenticated={false} isAdmin={false} user={null} displayInfo={null} />
      );

      const signInLink = screen.getByLabelText('Sign in to your account');
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/auth/login');
    });

    it('should render user icon in sign-in button', () => {
      render(
        <HeaderAuthClient isAuthenticated={false} isAdmin={false} user={null} displayInfo={null} />
      );

      expect(screen.getByTestId('icon-user')).toBeInTheDocument();
    });
  });

  describe('Authenticated state', () => {
    it('should render welcome message with short name', () => {
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    it('should render account dropdown button', () => {
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      const accountButton = screen.getByRole('button', { name: /open account menu/i });
      expect(accountButton).toBeInTheDocument();
    });

    it('should render user avatar when image is available', () => {
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      const avatar = screen.getByAltText('John Doe avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('should render initials when no avatar image', () => {
      const userWithoutImage = { ...mockUser, image: null };
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={userWithoutImage}
          displayInfo={mockDisplayInfo}
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('should render "My profile" link', async () => {
      const user = userEvent.setup();
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      const accountButton = screen.getByRole('button', { name: /open account menu/i });
      await user.click(accountButton);

      // Radix UI renders menu items, not links directly
      const profileLink = screen.getByText('My profile');
      expect(profileLink).toBeInTheDocument();
      expect(profileLink.closest('a')).toHaveAttribute('href', '/profile');
    });

    it('should render admin dashboard link for admin users', async () => {
      const user = userEvent.setup();
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={true}
          user={{ ...mockUser, role: 'admin' }}
          displayInfo={mockDisplayInfo}
        />
      );

      const accountButton = screen.getByRole('button', { name: /open account menu/i });
      await user.click(accountButton);

      // Radix UI renders menu items, not links directly
      const adminLink = screen.getByText('Admin dashboards');
      expect(adminLink).toBeInTheDocument();
      expect(adminLink.closest('a')).toHaveAttribute('href', '/admin');
    });

    it('should not render admin dashboard link for regular users', async () => {
      const user = userEvent.setup();
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      const accountButton = screen.getByRole('button', { name: /open account menu/i });
      await user.click(accountButton);

      expect(screen.queryByText('Admin dashboards')).not.toBeInTheDocument();
    });

    it('should call signOut when sign out is clicked', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValueOnce(undefined as any);

      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      const accountButton = screen.getByRole('button', { name: /open account menu/i });
      await user.click(accountButton);

      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/' });
      });
    });

    it('should show "Signing out..." text while signing out', async () => {
      const user = userEvent.setup();
      let resolveSignOut: () => void;
      const signOutPromise = new Promise<void>(resolve => {
        resolveSignOut = resolve;
      });
      mockSignOut.mockReturnValueOnce(signOutPromise as any);

      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      const accountButton = screen.getByRole('button', { name: /open account menu/i });
      await user.click(accountButton);

      const signOutButton = screen.getByText('Sign out');
      await user.click(signOutButton);

      await waitFor(() => {
        expect(screen.getByText('Signing out…')).toBeInTheDocument();
      });

      resolveSignOut!();
    });

    it('should prevent multiple sign out clicks', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined as any);

      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
        />
      );

      const accountButton = screen.getByRole('button', { name: /open account menu/i });
      await user.click(accountButton);

      const signOutButton = screen.getByText('Sign out');

      // Click multiple times quickly
      await user.click(signOutButton);
      await user.click(signOutButton);
      await user.click(signOutButton);

      // Should only call once
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it('should apply custom className', () => {
      const { container } = render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={mockDisplayInfo}
          className="custom-class"
        />
      );

      const rootDiv = container.firstChild;
      expect(rootDiv).toHaveClass('custom-class');
    });

    it('should render "Signed in" fallback when no short name', () => {
      render(
        <HeaderAuthClient
          isAuthenticated={true}
          isAdmin={false}
          user={mockUser}
          displayInfo={{ ...mockDisplayInfo, shortName: '' }}
        />
      );

      expect(screen.getByText('Signed in')).toBeInTheDocument();
    });
  });
});
