/**
 * User Favorite Status - Server Component with Suspense
 *
 * This component fetches the user's favorite status for a listing using
 * the 'use cache: private' directive in the favorites DAL.
 *
 * Key features:
 * - Server component for initial render
 * - Uses 'use cache: private' via favorites.dal for user-specific caching
 * - Wrapped in Suspense to protect static shell during PPR
 * - Passes initial state to client FavoriteButton for interactivity
 */

import { Suspense } from 'react';
import { checkIsFavorited } from '@/lib/data-access/favorites.dal';
import { auth } from '../../../../auth';
import { FavoriteButton } from './FavoriteButton';

interface UserFavoriteStatusProps {
  listingId: string;
  slug: string;
  listingTitle?: string;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Inner component that does the actual fetching
 * This is separated to allow Suspense to catch the async boundary
 */
async function FavoriteStatusFetcher({
  listingId,
  slug,
  listingTitle,
  className,
  showText,
  size,
}: UserFavoriteStatusProps) {
  // Get session - this uses cookies() which is allowed with 'use cache: private'
  const session = await auth();
  const userId = session?.user?.id;

  // Check favorite status using the cached DAL function
  const isFavorited = await checkIsFavorited(listingId, userId);

  return (
    <FavoriteButton
      listingId={listingId}
      slug={slug}
      listingTitle={listingTitle}
      initialIsFavorited={isFavorited}
      className={className}
      showText={showText}
      size={size}
    />
  );
}

/**
 * Loading fallback for the favorite button
 * Shows a placeholder heart icon while loading
 */
function FavoriteButtonSkeleton({ 
  className,
  size = 'md',
}: { 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <button
      type="button"
      disabled
      aria-label="Loading favorite status"
      className={`inline-flex items-center justify-center rounded-full p-2 text-gray-300 transition-colors ${className ?? ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6 animate-pulse"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  );
}

/**
 * Public component that wraps the fetcher in Suspense
 * This allows the static shell to render immediately while the
 * user-specific favorite status loads asynchronously
 */
export default function UserFavoriteStatus({
  listingId,
  slug,
  listingTitle,
  className,
  showText,
  size,
}: UserFavoriteStatusProps) {
  return (
    <Suspense fallback={<FavoriteButtonSkeleton className={className} />}>
      <FavoriteStatusFetcher
        listingId={listingId}
        slug={slug}
        listingTitle={listingTitle}
        className={className}
        showText={showText}
        size={size}
      />
    </Suspense>
  );
}
