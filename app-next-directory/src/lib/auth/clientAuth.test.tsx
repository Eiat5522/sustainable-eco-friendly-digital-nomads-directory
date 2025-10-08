/// <reference types="@testing-library/jest-dom" />
import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { useSession, signIn, signOut } from 'next-auth/react';

// Import the components to be tested
import {
  AuthProvider,
  useAuthContext,
  Authenticated,
  RequireRole,
  RequirePermission,
  AdminOnly,
} from './clientAuth';

// next-auth/react is globally mocked, so we just need to get a handle to the mock functions
const mockUseSession = useSession as jest.Mock;
const mockSignIn = signIn as jest.Mock;
const mockSignOut = signOut as jest.Mock;

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides authentication context with user data', async () => {
    const mockSession = { user: { name: 'Test User', email: 'test@example.com', role: 'user' } };
    mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });

    const TestComponent = () => {
      const { user, isAuthenticated } = useAuthContext();
      return (
        <div>
          <span>{user?.name}</span>
          <span>{isAuthenticated ? 'authenticated' : 'not authenticated'}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('authenticated')).toBeInTheDocument();
    });
  });

  it('provides loading state during authentication check', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    const TestComponent = () => {
      const { isLoading } = useAuthContext();
      return <div>{isLoading ? 'loading' : 'loaded'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('loading')).toBeInTheDocument();
    });
  });

  it('forwards arguments to signIn and signOut', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    const TestComponent = () => {
      const { signIn: localSignIn, signOut: localSignOut } = useAuthContext();
      return (
        <div>
          <button onClick={() => localSignIn('google')}>Sign In</button>
          <button onClick={() => localSignOut()}>Sign Out</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByText('Sign In'));
    expect(mockSignIn).toHaveBeenCalledWith('google');

    await userEvent.click(screen.getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();
  });
});

describe('Authenticated component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when authenticated', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <Authenticated>
          <div>Protected Content</div>
        </Authenticated>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('renders fallback when not authenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    render(
      <AuthProvider>
        <Authenticated fallback={<div>Please log in</div>}>
          <div>Protected Content</div>
        </Authenticated>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Please log in')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while loading', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(
      <AuthProvider>
        <Authenticated>
          <div>Protected Content</div>
        </Authenticated>
      </AuthProvider>
    );

    await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });
});

describe('RequireRole component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user has required role', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <RequireRole role="admin">
          <div>Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  it('renders fallback when user lacks required role', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <RequireRole role="admin" fallback={<div>Access Denied</div>}>
          <div>Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});

describe('RequirePermission component', () => {
    const mockHasFeaturePermission = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

  it('renders children when user has required permission', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });
    mockHasFeaturePermission.mockReturnValue(true);

    render(
      <AuthProvider hasFeaturePermission={mockHasFeaturePermission}>
        <RequirePermission feature="manageListings">
          <div>Manage Content</div>
        </RequirePermission>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Content')).toBeInTheDocument();
    });
    expect(mockHasFeaturePermission).toHaveBeenCalledWith('admin', 'manageListings');
  });

  it('renders fallback when user lacks required permission', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });
    mockHasFeaturePermission.mockReturnValue(false);

    render(
      <AuthProvider hasFeaturePermission={mockHasFeaturePermission}>
        <RequirePermission feature="manageUsers" fallback={<div>No Access</div>}>
          <div>User Management</div>
        </RequirePermission>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
      expect(screen.getByText('No Access')).toBeInTheDocument();
    });
    expect(mockHasFeaturePermission).toHaveBeenCalledWith('user', 'manageUsers');
  });
});

describe('AdminOnly component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children for admin role', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <AdminOnly>
          <div>Admin Panel</div>
        </AdminOnly>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
  });

  it('renders children for superAdmin role', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'superAdmin' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <AdminOnly>
          <div>Admin Panel</div>
        </AdminOnly>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
  });

  it('renders fallback for non-admin users', async () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <AdminOnly fallback={<div>Admins Only</div>}>
          <div>Admin Panel</div>
        </AdminOnly>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
      expect(screen.getByText('Admins Only')).toBeInTheDocument();
    });
  });
});