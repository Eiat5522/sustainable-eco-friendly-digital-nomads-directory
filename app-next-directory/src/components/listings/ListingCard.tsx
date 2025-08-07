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
  const isTestEnv = process.env.NODE_ENV === 'test';
  const imageUrl = useMemo(() => {
    try {
      if (listing.primaryImage?.asset?._ref) {
        return urlFor(listing.primaryImage)
          .width(400)
          .height(300)
          .fit('crop')
          .auto('format')
          .url();
      }
      if (listing.galleryImages && listing.galleryImages.length > 0 && listing.galleryImages[0]?.asset?._ref) {
        return urlFor(listing.galleryImages[0])
          .width(400)
          .height(300)
          .fit('crop')
          .auto('format')
          .url();
      }
      return '/images/test-image.jpg';
    } catch (err) {
      return '/images/test-image.jpg';
    }
  }, [listing.primaryImage, listing.galleryImages]);

  const altText = listing.name?.trim() !== '' ? listing.name : 'Unnamed Listing';

  return (
    <Link href={getListingUrl(listing)} className="block border rounded-lg overflow-hidden">
      <div className="w-full h-48 relative">
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const FALLBACK_IMAGE = '/images/test-image.jpg';
            const img = e.target as HTMLImageElement;
            if (img.src.endsWith(FALLBACK_IMAGE)) return; // already attempted fallback
            img.src = FALLBACK_IMAGE;
          }}
          {...(isTestEnv && {
            'data-testid': 'image-mock',
            'data-src': imageUrl,
            'data-alt': altText,
          })}
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
    </Link>
  );
}
