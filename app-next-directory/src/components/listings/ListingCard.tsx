// src/components/listings/ListingCard.tsx
import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AppListingCard } from '@/types/appView';
import { ListingCategory, PriceRange } from '@/types/enums';
import { urlFor } from '@/lib/sanity/image';

interface ListingCardProps {
  listing: AppListingCard;
  searchQuery?: string;
}

const getListingUrl = (listing: AppListingCard) => {
  const slug = listing.slug ?? listing.id;
  return `/listings/${slug}`;
};

export function ListingCard({ listing, searchQuery }: ListingCardProps) {
  const imageUrl = useMemo(() => {
    try {
      // 1) Try primary image
      if (listing.primaryImage?.asset?._ref) {
        return urlFor(listing.primaryImage)
          .width(400)
          .height(300)
          .fit('crop')
          .auto('format')
          .url();
      }
      // 2) Fallback to first gallery image
      if (listing.galleryImages && listing.galleryImages.length > 0) {
        return urlFor(listing.galleryImages[0])
          .width(400)
          .height(300)
          .fit('crop')
          .auto('format')
          .url();
      }
      // 3) No images at all → fallback
      return '/test-image.jpg';
    } catch (err) {
      // On any urlFor error, use fallback
      return '/test-image.jpg';
    }
  }, [listing.primaryImage, listing.galleryImages]);

  const altText = listing.name?.trim() !== '' ? listing.name : 'Unnamed Listing';

  return (
    <Link href={getListingUrl(listing)}>
      <a className="block border rounded-lg overflow-hidden">
        <div className="w-full h-48 relative">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            className="object-cover"
            data-testid="image-mock"
            // allow the jest mock to pick up data-src and data-alt
            data-src={imageUrl}
            data-alt={altText}
          />
        </div>
        <div className="p-4">
          <h2 className="text-lg font-semibold">
            {searchQuery
              ? /* highlight logic if needed */
                listing.name
              : listing.name || 'Unnamed Listing'}
          </h2>
          <p className="text-sm text-gray-500">{listing.city?.country}</p>
          <p className="mt-2">
            {listing.priceRange?.toLowerCase() as PriceRange}
          </p>
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 rounded">
            {listing.type?.toLowerCase() ?? ''} 
          </span>
        </div>
      </a>
    </Link>
  );
}
