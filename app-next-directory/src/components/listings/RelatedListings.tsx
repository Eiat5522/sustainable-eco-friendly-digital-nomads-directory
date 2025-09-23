'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { CityDTO } from '@/types/dto';

interface RelatedListing {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  // Supports either a simple city name or a full CityDTO
  city: string | CityDTO | null;
  priceRange: 'budget' | 'moderate' | 'premium';
  ecoFocusTags: string[];
}

interface RelatedListingsProps {
  listings: RelatedListing[];
}

export function RelatedListings({ listings }: RelatedListingsProps) {
  if (!listings || listings.length === 0) {
    return null;
  }

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'budget':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'premium':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <section className="mb-8">
      <SectionHeader 
        title="Related Listings"
        description="Discover similar sustainable venues you might love"
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.slug}`}
            className="block"
            data-testid="related-listing-card"
            data-has-image={Boolean(listing.imageUrl)}
          >
            <NeoCard
              variant="elevated"
              className="group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 cursor-pointer h-full"
            >
              <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
                {/* Local placeholder for graceful fallback */}
                <Image
                  src="/placeholder_image.png"
                  alt=""
                  aria-hidden
                  role="presentation"
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  data-testid="related-listing-fallback"
                />
                {/* Remote image layered above; hide on error so placeholder shows */}
                {listing.imageUrl && (
                  <Image
                    src={listing.imageUrl}
                    alt={`${listing.name} in ${typeof listing.city === 'string' ? listing.city : (listing.city?.name ?? '')}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.hidden = true; }}
                  />
                )}
              
                {/* Price Range Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriceRangeColor(listing.priceRange)}`}>
                    {listing.priceRange.charAt(0).toUpperCase() + listing.priceRange.slice(1)}
                  </span>
                </div>
              </div>

              <NeoCardHeader>
                <NeoCardTitle className="group-hover:text-neo-primary transition-colors duration-200">
                  {listing.name}
                </NeoCardTitle>
                {(() => {
                  const cityText = typeof listing.city === 'string' 
                    ? listing.city 
                    : (listing.city?.name ?? '');
                  return cityText ? (
                    <p className="body-sm text-neo-text-secondary mt-1">{cityText}</p>
                  ) : null;
                })()}
              </NeoCardHeader>

              <NeoCardContent>
                {/* Eco Focus Tags */}
                {listing.ecoFocusTags && listing.ecoFocusTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {listing.ecoFocusTags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-neo-success/20 text-neo-success text-xs rounded-lg font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {listing.ecoFocusTags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                        +{listing.ecoFocusTags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </NeoCardContent>
            </NeoCard>
          </Link>
        ))}
      </div>
    </section>
  );
}
