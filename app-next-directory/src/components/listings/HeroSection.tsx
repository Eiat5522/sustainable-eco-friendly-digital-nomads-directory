'use client';
// (Remove the erroneous and unnecessary React import line)
import Image from 'next/image';
import { MapPin, Heart } from 'lucide-react';
import { NeoCard, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';
import { NeoButton } from '@/components/ui/neo-button';
import type { ListingDetailDTO } from '@/types/dto';

interface HeroSectionProps {
  listing: ListingDetailDTO;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function HeroSection({ listing, isFavorited = false, onToggleFavorite }: HeroSectionProps) {
  return (
    <NeoCard variant="elevated" className="mb-8">
      <div className="relative h-64 md:h-80 mb-6 overflow-hidden rounded-lg">
        {listing.imageUrl && (
          <Image
            src={listing.imageUrl}
            alt={`${listing.name} - ${listing.city?.name} sustainable venue`}
            fill
            sizes="(min-width: 768px) 100vw, 100vw"
            className="object-cover"
            priority
          />
        )}
        
        {/* Favorite Button Overlay */}
        <div className="absolute top-4 right-4">
          <NeoButton
            variant={isFavorited ? "accent" : "secondary"}
            size="sm"
            className="bg-white/90 hover:bg-white"
            onClick={onToggleFavorite}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart 
              size={20} 
              className={isFavorited ? "fill-current text-red-500" : "text-gray-600"} 
            />
          </NeoButton>
        </div>
      </div>

      <NeoCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <NeoCardTitle className="heading-xl mb-2">
              {listing.name}
            </NeoCardTitle>
            
            {listing.city && (
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={20} className="text-neo-text-secondary" />
                <span className="body-lg text-neo-text-secondary">
                  {listing.city.name}, {listing.city.country}
                </span>
              </div>
            )}

            {listing.shortDescription && (
              <p className="body-md text-neo-text-secondary mb-4">
                {listing.shortDescription}
              </p>
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