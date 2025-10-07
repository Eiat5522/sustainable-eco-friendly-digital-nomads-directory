/// <reference types="@testing-library/jest-dom" />
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';

// No extend-expect import needed; either rely on jest.setup.ts importing '@testing-library/jest-dom'
// or keep the triple-slash reference above with this per-file import if you prefer:
// import '@testing-library/jest-dom';

const mockUseSession = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();

// We'll load the SUT after mocking, so declare holders:
let AuthProvider: any;
let useAuthContext: any;
let Authenticated: any;
let RequireRole: any;
let RequirePermission: any;
let AdminOnly: any;

// Mock modules BEFORE importing the SUT
beforeAll(async () => {
  // Export the jest.fn references directly so tests can call
  // mockUseSession.mockReturnValue(...) and have useSession() return it.
  await jest.unstable_mockModule('next-auth/react', () => ({
    __esModule: true,
    useSession: mockUseSession,
    signIn: mockSignIn,
    signOut: mockSignOut,
  }));

  // Export permission helpers as predictable functions (or jest.fn references).
  await jest.unstable_mockModule('../../types/auth', () => ({
    __esModule: true,
    hasPagePermission: (role: string, page: string) => {
      if (role === 'admin') return true;
      if (role === 'user' && page === 'listings') return true;
      return false;
    },
    hasFeaturePermission: (role: string, feature: string) => {
      if (role === 'admin') return true;
      if (role === 'user' && feature === 'viewListings') return true;
      return false;
    },
  }));

  const mod = await import('./clientAuth');
  AuthProvider = mod.AuthProvider;
  useAuthContext = mod.useAuthContext;
  Authenticated = mod.Authenticated;
  RequireRole = mod.RequireRole;
  RequirePermission = mod.RequirePermission;
  AdminOnly = mod.AdminOnly;
});

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides authentication context with user data', () => {
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

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('authenticated')).toBeInTheDocument();
  });

  it('provides loading state during authentication check', () => {
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

    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('provides unauthenticated state when no session', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    const TestComponent = () => {
      const { isAuthenticated, userRole } = useAuthContext();
      return (
        <div>
          <span>{isAuthenticated ? 'authenticated' : 'not authenticated'}</span>
          <span>{userRole}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('not authenticated')).toBeInTheDocument();
    expect(screen.getByText('unidentifiedUser')).toBeInTheDocument();
  });

  it('forwards arguments to signIn and signOut', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    const TestComponent = () => {
      const { signIn, signOut } = useAuthContext();
      return (
        <div>
          <button onClick={() => signIn('google')}>Sign In</button>
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    screen.getByText('Sign In').click();
    expect(mockSignIn).toHaveBeenCalledWith('google');

    screen.getByText('Sign Out').click();
    expect(mockSignOut).toHaveBeenCalled();
  });
});

describe('Authenticated component', () => {
  it('renders children when authenticated', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <Authenticated>
          <div>Protected Content</div>
        </Authenticated>
      </AuthProvider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders fallback when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });

    render(
      <AuthProvider>
        <Authenticated fallback={<div>Please log in</div>}>
          <div>Protected Content</div>
        </Authenticated>
      </AuthProvider>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });

  it('shows loading spinner while loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(
      <AuthProvider>
        <Authenticated>
          <div>Protected Content</div>
        </Authenticated>
      </AuthProvider>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toHaveClass('animate-spin');
  });
});

describe('RequireRole component', () => {
  it('renders children when user has required role', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <RequireRole role="admin">
          <div>Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks required role', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <RequireRole role="admin" fallback={<div>Access Denied</div>}>
          <div>Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('shows loading spinner while loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(
      <AuthProvider>
        <RequireRole role="admin">
          <div>Admin Content</div>
        </RequireRole>
      </AuthProvider>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toHaveClass('animate-spin');
  });
});

describe('RequirePermission component', () => {
  it('renders children when user has required permission', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <RequirePermission feature="manageListings">
          <div>Manage Content</div>
        </RequirePermission>
      </AuthProvider>
    );

    expect(screen.getByText('Manage Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks required permission', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <RequirePermission feature="manageUsers" fallback={<div>No Access</div>}>
          <div>User Management</div>
        </RequirePermission>
      </AuthProvider>
    );

    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    expect(screen.getByText('No Access')).toBeInTheDocument();
  });

  it('shows loading spinner while loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(
      <AuthProvider>
        <RequirePermission feature="manageListings">
          <div>Manage Content</div>
        </RequirePermission>
      </AuthProvider>
    );

    expect(screen.queryByText('Manage Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toHaveClass('animate-spin');
  });
});

describe('AdminOnly component', () => {
  it('renders children for admin role', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <AdminOnly>
          <div>Admin Panel</div>
        </AdminOnly>
      </AuthProvider>
    );

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('renders children for superAdmin role', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'superAdmin' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <AdminOnly>
          <div>Admin Panel</div>
        </AdminOnly>
      </AuthProvider>
    );

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('renders fallback for non-admin users', () => {
    mockUseSession.mockReturnValue({ data: { user: { role: 'user' } }, status: 'authenticated' });

    render(
      <AuthProvider>
        <AdminOnly fallback={<div>Admins Only</div>}>
          <div>Admin Panel</div>
        </AdminOnly>
      </AuthProvider>
    );

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Admins Only')).toBeInTheDocument();
  });

  it('shows loading spinner while loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });

    render(
      <AuthProvider>
        <AdminOnly>
          <div>Admin Panel</div>
        </AdminOnly>
      </AuthProvider>
    );

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toHaveClass('animate-spin');
  });
});
