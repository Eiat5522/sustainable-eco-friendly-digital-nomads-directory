/**
 * User Auth Status - Server Component with Suspense
 *
 * This component fetches the user's authentication status using
 * the 'use cache: private' directive in the auth DAL.
 *
 * Key features:
 * - Server component for initial render
 * - Uses 'use cache: private' via auth.dal for user-specific caching
 * - Wrapped in Suspense to protect static shell during PPR
 * - Passes initial auth state to client components for interactivity
 */

import { Suspense } from 'react';
import { getAuthStatus } from '@/lib/data-access/auth.dal';
import { getUserDisplayInfo } from '@/lib/user-display';
import { HeaderAuthClient } from './HeaderAuthClient';

/**
 * Default fallback text for user display when name is unavailable.
 * Extracted as a constant for easier internationalization (i18n) support.
 */
const DEFAULT_USER_DISPLAY_FALLBACK = 'your account';

interface UserAuthStatusProps {
  className?: string;
}

/**
 * Inner component that does the actual auth status fetching
 * Separated to allow Suspense to catch the async boundary
 */
async function AuthStatusFetcher({ className }: UserAuthStatusProps) {
  let authStatus;
  try {
    authStatus = await getAuthStatus();
  } catch {
    // Handle error - user is not authenticated
    authStatus = { isAuthenticated: false, isAdmin: false, user: null };
  }

  const displayInfo = authStatus.isAuthenticated && authStatus.user
    ? getUserDisplayInfo(authStatus.user, DEFAULT_USER_DISPLAY_FALLBACK)
    : null;

  return (
    <HeaderAuthClient
      isAuthenticated={authStatus.isAuthenticated}
      isAdmin={authStatus.isAdmin}
      user={authStatus.user}
      displayInfo={displayInfo}
      className={className}
    />
  );
}

/**
 * Loading skeleton for auth UI
 * Shows a placeholder while authentication status loads
 */
function AuthSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-4 ${className ?? ''}`}>
      {/* Placeholder for sign-in button */}
      <div
        className="inline-flex w-10 h-10 bg-gray-200 animate-pulse rounded-full items-center justify-center"
        role="status"
        aria-busy="true"
      >
        <span className="sr-only">Loading authentication status</span>
      </div>
    </div>
  );
}

/**
 * Public component that wraps the fetcher in Suspense
 * Allows the static shell to render immediately while
 * user-specific auth status loads asynchronously
 */
export default function UserAuthStatus({ className }: UserAuthStatusProps) {
  return (
    <Suspense fallback={<AuthSkeleton className={className} />}>
      <AuthStatusFetcher className={className} />
    </Suspense>
  );
}
