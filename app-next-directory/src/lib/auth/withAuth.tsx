'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { type ComponentType, useEffect } from 'react';
import type { UserRole } from '../../types/auth';

interface WithAuthOptions {
  requiredRole?: UserRole;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Higher-order component that adds authentication requirements to a component
 * @param Component - The component to wrap
 * @param options - Authentication options
 * @returns Wrapped component with authentication
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
): ComponentType<P> {
  const { requiredRole, redirectTo = '/login', requireAuth = true } = options;

  function AuthenticatedComponent(props: P) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const user = session?.user;
    const userRole = (user as { role?: UserRole })?.role || 'unidentifiedUser';

    useEffect(() => {
      if (status === 'loading') return; // Still loading

      if (requireAuth && !session) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole && userRole !== requiredRole) {
        router.push('/unauthorized');
        return;
      }
    }, [session, status, router, userRole]);

    // Show loading state while checking authentication
    if (status === 'loading') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      );
    }

    // Don't render if authentication check fails
    if (requireAuth && !session) {
      return null;
    }

    if (requiredRole && userRole !== requiredRole) {
      return null;
    }

    return <Component {...props} />;
  }

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return AuthenticatedComponent;
}

/**
 * HOC for admin-only components
 */
export function withAdminAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  return withAuth(Component, { requiredRole: 'admin' });
}

/**
 * HOC for authenticated components (any logged-in user)
 */
export function withUserAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  return withAuth(Component, { requireAuth: true });
}
