/**
 * Client-side authentication utilities
 * These are Edge Runtime compatible and work in client components
 */

'use client';

import { UserRole } from '@/types/auth';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for authentication with role checking
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isAuthenticated = !!user;
  const isLoading = status === 'loading';

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user?.role) return false;
      // Role hierarchy: superAdmin > admin > editor > venueOwner > user
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      venueOwner: 2,
      editor: 3,
      admin: 4,
      superAdmin: 5,
    };

    const userLevel = roleHierarchy[user.role as UserRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  };

  const requireAuth = (callbackUrl?: string) => {
    if (!isAuthenticated && !isLoading) {
      signIn(undefined, { callbackUrl: callbackUrl || window.location.href });
    }
  };

  const requireRole = (requiredRole: UserRole, fallbackUrl = '/') => {
    if (isAuthenticated && !hasRole(requiredRole)) {
      router.push(fallbackUrl);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    hasRole,
    requireAuth,
    requireRole,
    signIn,
    signOut,
  };
}

/**
 * Role-based access control hook
 */
export function useRBAC() {
  const { user, hasRole } = useAuth();

  const canViewAdmin = () => hasRole('admin');
  const canEditContent = () => hasRole('editor');  const canManageVenues = () => hasRole('venueOwner');
  const canCreateListings = () => hasRole('venueOwner');

  const permissions = {
    canViewAdmin: canViewAdmin(),
    canEditContent: canEditContent(),
    canManageVenues: canManageVenues(),
    canCreateListings: canCreateListings(),
    userRole: user?.role as UserRole,
  };

  return permissions;
}

/**
 * Authentication status component
 */
export function AuthStatus() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => signIn()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {user?.image && (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium">{user?.name}</span>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {user?.role}
        </span>
      </div>
      <button
        onClick={() => signOut()}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        Sign Out
      </button>
    </div>
  );
}

/**
 * Protected route wrapper component
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackUrl?: string;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallbackUrl = '/',
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, requireAuth } = useAuth();

  // Show loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Require authentication
  if (!isAuthenticated) {
    requireAuth();
    return null;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to view this page.
          </p>
          <a
            href={fallbackUrl}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
