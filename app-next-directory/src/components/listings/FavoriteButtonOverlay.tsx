'use client';

import type React from 'react';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';

type FavoriteButtonOverlayProps = {
  listingSlug: string;
  listingTitle: string;
  initialIsFavorited?: boolean;
  className?: string;
};

export function FavoriteButtonOverlay({
  listingSlug,
  listingTitle,
  initialIsFavorited,
  className = 'bg-white/90 hover:bg-white',
}: FavoriteButtonOverlayProps): React.JSX.Element {
  return (
    <FavoriteButton
      data-testid="favorite-button"
      data-listing-id={listingSlug}
      data-listing-title={listingTitle}
      listingId={listingSlug}
      listingTitle={listingTitle}
      size="sm"
      className={className}
      initialIsFavorited={initialIsFavorited}
    />
  );
}
