'use client';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { NeoCard, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { FALLBACK_IMAGE } from '@/lib/dto-transformer';
import type { ListingDetailDTO } from '@/types/dto';

interface HeroSectionProps {
  listing: ListingDetailDTO;
  // Optional controlled favorite props for integration tests / parent control
  isFavorited?: boolean;
  onToggleFavorite?: () => Promise<void> | void;
}

export function HeroSection(props: Readonly<HeroSectionProps>): React.JSX.Element {
  const { listing } = props;
  const hasRealHeroImage =
    typeof listing.imageUrl === 'string' &&
    listing.imageUrl.length > 0 &&
    listing.imageUrl !== FALLBACK_IMAGE;
  return (
    <NeoCard variant="elevated" className="mb-8">
      <div className="relative h-64 md:h-80 mb-6 overflow-hidden rounded-lg">
        {hasRealHeroImage && (
          <Image
            src={listing.imageUrl}
            alt={`${listing.name}${listing.city?.name ? ` - ${listing.city?.name}` : ''} sustainable venue`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}

        {/* Favorite Button Overlay */}
        <div className="absolute top-4 right-4">
          <FavoriteButton
            data-testid="favorite-button"
            data-listing-id={listing.slug}
            data-listing-title={listing.name}
            listingId={listing.slug}
            listingTitle={listing.name}
            size="sm"
            className="bg-white/90 hover:bg-white"
            isFavorited={props.isFavorited}
            onToggle={props.onToggleFavorite}
          />
        </div>
      </div>

      <NeoCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <NeoCardTitle className="heading-xl mb-2">{listing.name}</NeoCardTitle>

            {listing.city && (
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-neo-text-secondary" />
                <span className="body-lg text-neo-text-secondary">
                  {listing.city.name}, {listing.city.country}
                </span>
              </div>
            )}

            {listing.shortDescription && (
              <p className="body-md text-neo-text-secondary mb-4">{listing.shortDescription}</p>
            )}

            {/* Price Range Display */}
            {listing.priceRange && (
              <div className="inline-flex items-center px-3 py-1 bg-neo-secondary/20 rounded-lg">
                <span className="text-sm font-medium text-neo-text-primary capitalize">
                  {listing.priceRange} Range
                </span>
              </div>
            )}
          </div>
        </div>
      </NeoCardHeader>
    </NeoCard>
  );
}
