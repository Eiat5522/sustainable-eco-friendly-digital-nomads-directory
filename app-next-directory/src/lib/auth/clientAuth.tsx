'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import type { DefaultSession } from "next-auth";
import { createContext, useContext, ReactNode } from "react";
import { UserRole, hasPagePermission, hasFeaturePermission } from "../../types/auth";

// Narrow the user shape from next-auth, adding optional role
type AppUser = (DefaultSession["user"] & { role?: UserRole }) | null;

// Auth Context Type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AppUser;
  userRole: UserRole;
  hasPagePermission: (page: string, action: string) => boolean;
  hasFeaturePermission: (feature: string) => boolean;
  // Forward exact next-auth types
  signIn: typeof signIn;
  signOut: typeof signOut;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component - wraps app with authentication context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();

  const user: AppUser = session?.user ?? null;
  const userRole: UserRole = user?.role ?? 'unidentifiedUser';

  const contextValue: AuthContextType = {
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    user,
    userRole,
    hasPagePermission: (page: string, action: string) => {
      return hasPagePermission(userRole, page as any, action as any);
    },
    hasFeaturePermission: (feature: string) => {
      return hasFeaturePermission(userRole, feature as any);
    },
    // IMPORTANT: assign the next-auth functions directly (no wrapper),
    // so their TS signatures stay intact.
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

/**
 * Component that renders children only if user is authenticated
 */
interface AuthenticatedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function Authenticated({ children, fallback = null }: AuthenticatedProps) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div
        data-testid="loading"
        role="status"
        aria-live="polite"
        className="flex justify-center items-center h-64"
      >
        <div data-testid="spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that renders children only if user has specific role
 */
interface RequireRoleProps {
  role: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { userRole, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div
        data-testid="loading"
        role="status"
        aria-live="polite"
        className="flex justify-center items-center h-64"
      >
        <div data-testid="spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return userRole === role ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that renders children only if user has permission for specific feature
 */
interface RequirePermissionProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({ feature, children, fallback = null }: RequirePermissionProps) {
  const { hasFeaturePermission, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div
        data-testid="loading"
        role="status"
        aria-live="polite"
        className="flex justify-center items-center h-64"
      >
        <div data-testid="spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  return hasFeaturePermission(feature) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that renders children only for admin users
 */
interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { userRole, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div
        data-testid="loading"
        role="status"
        aria-live="polite"
        className="flex justify-center items-center h-64"
      >
        <div data-testid="spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'superAdmin';
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
