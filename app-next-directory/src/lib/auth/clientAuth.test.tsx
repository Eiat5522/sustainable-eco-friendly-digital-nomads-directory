/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn, signOut, useSession } from 'next-auth/react';
import type { UserRole } from '../../types/auth';
import {
  AdminOnly,
  Authenticated,
  AuthProvider,
  RequirePermission,
  RequireRole,
  useAuthContext,
} from './clientAuth';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

const useSessionMock = useSession as jest.Mock;
const signInMock = signIn as jest.Mock;
const signOutMock = signOut as jest.Mock;

describe('clientAuth context and helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when useAuthContext is used outside of provider', () => {
    const Consumer = () => {
      useAuthContext();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(
      'useAuthContext must be used within an AuthProvider'
    );
  });

  it('provides session data and permission helpers to consumers', async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: { id: 'user-1', email: 'user@example.com', role: 'admin' as UserRole },
      },
      status: 'authenticated',
    });

    const hasPagePermissionMock = jest.fn(() => true);
    const hasFeaturePermissionMock = jest.fn(() => false);

    const Consumer = () => {
      const ctx = useAuthContext();
      return (
        <div>
          <span data-testid="is-auth">{ctx.isAuthenticated ? 'yes' : 'no'}</span>
          <span data-testid="role">{ctx.userRole}</span>
          <button data-testid="page" onClick={() => ctx.hasPagePermission('dashboard', 'view')}>
            page
          </button>
          <button data-testid="feature" onClick={() => ctx.hasFeaturePermission('editContent')}>
            feature
          </button>
          <button data-testid="sign-in" onClick={() => ctx.signIn('credentials')}>
            signIn
          </button>
          <button data-testid="sign-out" onClick={() => ctx.signOut()}>
            signOut
          </button>
        </div>
      );
    };

    const user = userEvent.setup();
    render(
      <AuthProvider
        hasPagePermission={hasPagePermissionMock as any}
        hasFeaturePermission={hasFeaturePermissionMock as any}
      >
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-auth')).toHaveTextContent('yes');
    expect(screen.getByTestId('role')).toHaveTextContent('admin');

    await user.click(screen.getByTestId('page'));
    expect(hasPagePermissionMock).toHaveBeenCalledWith('admin', 'dashboard', 'view');

    await user.click(screen.getByTestId('feature'));
    expect(hasFeaturePermissionMock).toHaveBeenCalledWith('admin', 'editContent');

    await user.click(screen.getByTestId('sign-in'));
    expect(signInMock).toHaveBeenCalledWith('credentials');

    await user.click(screen.getByTestId('sign-out'));
    expect(signOutMock).toHaveBeenCalled();
  });

  describe('Authenticated component', () => {
    it('renders loading state while session is loading', () => {
      useSessionMock.mockReturnValue({ data: null, status: 'loading' });

      render(
        <AuthProvider>
          <Authenticated>
            <div>Protected</div>
          </Authenticated>
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders children when user is authenticated', () => {
      useSessionMock.mockReturnValue({
        data: { user: { email: 'user@example.com' } },
        status: 'authenticated',
      });

      render(
        <AuthProvider>
          <Authenticated>
            <div data-testid="protected">Protected</div>
          </Authenticated>
        </AuthProvider>
      );

      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });

    it('renders fallback when user is not authenticated', () => {
      useSessionMock.mockReturnValue({ data: null, status: 'unauthenticated' });

      render(
        <AuthProvider>
          <Authenticated fallback={<div data-testid="fallback">Please sign in</div>}>
            <div data-testid="protected">Protected</div>
          </Authenticated>
        </AuthProvider>
      );

      expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('RequireRole component', () => {
    it('shows loading indicator while session is loading', () => {
      useSessionMock.mockReturnValue({ data: null, status: 'loading' });

      render(
        <AuthProvider>
          <RequireRole>
            <div>Admin section</div>
          </RequireRole>
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders children when user has required role', () => {
      useSessionMock.mockReturnValue({
        data: { user: { role: 'admin' as UserRole } },
        status: 'authenticated',
      });

      render(
        <AuthProvider>
          <RequireRole>
            <div data-testid="role-pass">Allowed</div>
          </RequireRole>
        </AuthProvider>
      );

      expect(screen.getByTestId('role-pass')).toBeInTheDocument();
    });

    it('renders fallback when user lacks required role', () => {
      useSessionMock.mockReturnValue({
        data: { user: { role: 'user' as UserRole } },
        status: 'authenticated',
      });

      render(
        <AuthProvider>
          <RequireRole fallback={<div data-testid="role-fallback">Denied</div>}>
            <div data-testid="role-pass">Allowed</div>
          </RequireRole>
        </AuthProvider>
      );

      expect(screen.queryByTestId('role-pass')).not.toBeInTheDocument();
      expect(screen.getByTestId('role-fallback')).toBeInTheDocument();
    });
  });

  describe('RequirePermission component', () => {
    it('shows loading state while checking permissions', () => {
      useSessionMock.mockReturnValue({ data: null, status: 'loading' });

      render(
        <AuthProvider>
          <RequirePermission feature="editContent">
            <div>Feature</div>
          </RequirePermission>
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders children when permission helper returns true', async () => {
      useSessionMock.mockReturnValue({
        data: { user: { role: 'editor' as UserRole } },
        status: 'authenticated',
      });

      const hasFeaturePermissionMock = jest.fn(() => true);

      render(
        <AuthProvider hasFeaturePermission={hasFeaturePermissionMock as any}>
          <RequirePermission feature="editContent">
            <div data-testid="permission-pass">Granted</div>
          </RequirePermission>
        </AuthProvider>
      );

      expect(hasFeaturePermissionMock).toHaveBeenCalledWith('editor', 'editContent');
      expect(screen.getByTestId('permission-pass')).toBeInTheDocument();
    });

    it('renders fallback when permission helper returns false', () => {
      useSessionMock.mockReturnValue({
        data: { user: { role: 'user' as UserRole } },
        status: 'authenticated',
      });

      const hasFeaturePermissionMock = jest.fn(() => false);

      render(
        <AuthProvider hasFeaturePermission={hasFeaturePermissionMock as any}>
          <RequirePermission
            feature="editContent"
            fallback={<div data-testid="permission-fallback">No access</div>}
          >
            <div data-testid="permission-pass">Granted</div>
          </RequirePermission>
        </AuthProvider>
      );

      expect(screen.queryByTestId('permission-pass')).not.toBeInTheDocument();
      expect(screen.getByTestId('permission-fallback')).toBeInTheDocument();
    });
  });

  describe('AdminOnly component', () => {
    it('renders loading state while session is loading', () => {
      useSessionMock.mockReturnValue({ data: null, status: 'loading' });

      render(
        <AuthProvider>
          <AdminOnly>
            <div>Admin</div>
          </AdminOnly>
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders children for admin roles', () => {
      useSessionMock.mockReturnValue({
        data: { user: { role: 'admin' as UserRole } },
        status: 'authenticated',
      });

      render(
        <AuthProvider>
          <AdminOnly>
            <div data-testid="admin-pass">Admin Area</div>
          </AdminOnly>
        </AuthProvider>
      );

      expect(screen.getByTestId('admin-pass')).toBeInTheDocument();
    });

    it('renders children for super admin role', () => {
      useSessionMock.mockReturnValue({
        data: { user: { role: 'superAdmin' as UserRole } },
        status: 'authenticated',
      });

      render(
        <AuthProvider>
          <AdminOnly>
            <div data-testid="super-pass">Super Admin</div>
          </AdminOnly>
        </AuthProvider>
      );

      expect(screen.getByTestId('super-pass')).toBeInTheDocument();
    });

    it('renders fallback for non-admin roles', () => {
      useSessionMock.mockReturnValue({
        data: { user: { role: 'user' as UserRole } },
        status: 'authenticated',
      });

      render(
        <AuthProvider>
          <AdminOnly fallback={<div data-testid="admin-fallback">Restricted</div>}>
            <div data-testid="admin-pass">Admin Area</div>
          </AdminOnly>
        </AuthProvider>
      );

      expect(screen.queryByTestId('admin-pass')).not.toBeInTheDocument();
      expect(screen.getByTestId('admin-fallback')).toBeInTheDocument();
    });
  });
});
