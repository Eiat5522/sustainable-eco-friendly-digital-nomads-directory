'use client';

import { useSession } from 'next-auth/react';
import {
  type ACCESS_CONTROL_MATRIX,
  type FeaturePermissions,
  hasFeaturePermission,
  hasPagePermission,
  type PagePermissions,
  type UserRole,
} from '../types/auth';

/**
 * Custom hook to access authentication state and user information
 * @returns Authentication state and user data
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const userRole = (user as { role?: UserRole })?.role || 'unidentifiedUser';

  return {
    // Authentication state
    isAuthenticated: !!session,
    isLoading: status === 'loading',

    // User data
    user,
    userRole,

    // Utility functions
    hasPagePermission: (page: string, action: string) => {
      return hasPagePermission(
        userRole,
        page as keyof (typeof ACCESS_CONTROL_MATRIX)[UserRole]['pages'],
        action as keyof PagePermissions
      );
    },

    hasFeaturePermission: (feature: string) => {
      return hasFeaturePermission(userRole, feature as keyof FeaturePermissions);
    },

    // Session status
    status,
  };
}

/**
 * Hook to check if user has specific role
 * @param requiredRole - Role to check against
 * @returns Boolean indicating if user has the required role
 */
export function useRequireRole(requiredRole: UserRole) {
  const { userRole } = useAuth();
  return userRole === requiredRole;
}

/**
 * Hook to check if user has admin privileges
 * @returns Boolean indicating if user is admin or superAdmin
 */
export function useIsAdmin() {
  const { userRole } = useAuth();
  return userRole === 'admin' || userRole === 'superAdmin';
}
