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
import structuredLogger from '@/lib/logger';
import { getUserDisplayInfo } from '@/lib/user-display';
import { HeaderAuthClient } from './HeaderAuthClient';

/**
 * Default fallback text for user display when name is unavailable.
 * Extracted as a constant for easier internationalization (i18n) support.
 */
const DEFAULT_USER_DISPLAY_FALLBACK = 'your account';

interface UserAuthStatusProps {
  readonly className?: string;
}

/**
 * Inner component that does the actual auth status fetching
 * Separated to allow Suspense to catch the async boundary
 */
async function AuthStatusFetcher(props: Readonly<UserAuthStatusProps>) {
  const { className } = props;
  let authStatus: Awaited<ReturnType<typeof getAuthStatus>>;
  try {
    authStatus = await getAuthStatus();
  } catch (err) {
    // Handle error - user is not authenticated
    structuredLogger.error('[UserAuthStatus] Auth status fetch failed:', err);
    authStatus = { isAuthenticated: false, isAdmin: false, user: null } as const;
  }

  const displayInfo =
    authStatus.isAuthenticated && authStatus.user
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
function AuthSkeleton(props: Readonly<UserAuthStatusProps>) {
  const { className } = props;
  return (
    <div className={`flex items-center space-x-4 ${className ?? ''}`}>
      {/* Placeholder for sign-in button */}
      <output
        className="inline-flex w-10 h-10 bg-gray-200 animate-pulse rounded-full items-center justify-center"
        aria-busy="true"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">Loading authentication status</span>
      </output>
    </div>
  );
}

/**
 * Public component that wraps the fetcher in Suspense
 * Allows the static shell to render immediately while
 * user-specific auth status loads asynchronously
 */
export default function UserAuthStatus(props: Readonly<UserAuthStatusProps>) {
  return (
    <Suspense fallback={<AuthSkeleton className={props.className} />}>
      <AuthStatusFetcher className={props.className} />
    </Suspense>
  );
}
