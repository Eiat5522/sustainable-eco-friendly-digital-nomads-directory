'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { createContext, useContext, ReactNode } from "react";
import { UserRole, hasPagePermission, hasFeaturePermission } from "../../types/auth";

// Auth Context Type
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  userRole: UserRole;
  hasPagePermission: (page: string, action: string) => boolean;
  hasFeaturePermission: (feature: string) => boolean;
  signIn: () => void;
  signOut: () => void;
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
  
  const user = session?.user;
  const userRole = (user as any)?.role as UserRole || 'unidentifiedUser';

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
    // Forward any arguments to next-auth's signIn/signOut helpers to preserve provider and options.
    signIn: (...args: unknown[]) => signIn(...(args as any)),
    signOut: (...args: unknown[]) => signOut(...(args as any)),
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
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>;
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
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>;
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
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>;
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
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>;
  }

  const isAdmin = userRole === 'admin' || userRole === 'superAdmin';
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
