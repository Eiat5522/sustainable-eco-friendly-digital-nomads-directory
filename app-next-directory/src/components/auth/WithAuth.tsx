'use client';

import { useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "../../types/auth";

interface WithAuthProps {
  children: ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on authentication status and role
 */
export default function WithAuth({
  children,
  requiredRole,
  redirectTo = '/login',
  requireAuth = true,
  fallback = null,
}: WithAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const user = session?.user;
  const userRole = (user as any)?.role as UserRole || 'unidentifiedUser';
  const isLoading = status === 'loading';

  useEffect(() => {
    if (isLoading) return; // Still loading

    if (requireAuth && !session) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && userRole !== requiredRole) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router, requiredRole, requireAuth, redirectTo, userRole, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>;
  }

  // Check authentication requirements
  if (requireAuth && !session) {
    return <>{fallback}</>;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Wrapper component for admin-only content
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <WithAuth requiredRole="admin" requireAuth={true} fallback={fallback}>
      {children}
    </WithAuth>
  );
}

/**
 * Wrapper component for authenticated users only
 */
export function AuthenticatedOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <WithAuth requireAuth={true} fallback={fallback}>
      {children}
    </WithAuth>
  );
}
