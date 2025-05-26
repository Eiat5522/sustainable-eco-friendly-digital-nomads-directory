"use client";
import { highlightText } from '@/lib/highlight';
import { urlFor } from '@/lib/sanity/image';
import { Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ListingCardProps {
  listing: Listing | SanityListing;
  searchQuery?: string;
}

export function ListingCard({ listing, searchQuery = '' }: ListingCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const listingName =
    typeof listing === 'object' && listing !== null && 'name' in listing && typeof (listing as any).name === 'string'
      ? (listing as any).name
      : '';

  const isSanityListing = (currentListing: Listing | SanityListing): currentListing is SanityListing => {
    return (
      typeof currentListing === 'object' &&
      currentListing !== null &&
      '_type' in currentListing &&
      currentListing._type === 'listing'
    );
  };

  const getCategory = () => {
    if (isSanityListing(listing)) {
      return listing.category || 'Other';
    }
    if (typeof listing === 'object' && listing !== null) {
        if ('category' in listing && typeof (listing as any).category === 'string') {
            return (listing as any).category;
        }
        if ('type' in listing && typeof (listing as any).type === 'string') { // Common alternative for category
            return (listing as any).type;
        }
    }
    return 'Other';
  };

  const getImageUrl = () => {
    if (isSanityListing(listing)) {
      if (listing.mainImage) {
        try {
          return urlFor(listing.mainImage)
            .width(800)
            .height(480)
            .fit('crop')
            .auto('format')
            .url();
        } catch (error) {
          console.error('Error generating Sanity image URL:', error);
          return '';
        }
      }
    } else if (typeof listing === 'object' && listing !== null && 'primary_image_url' in listing && typeof (listing as any).primary_image_url === 'string') {
      return (listing as any).primary_image_url;
    }
    return '';
  };

  const getListingUrl = () => {
    let slug: string | undefined | null = null;
    if (isSanityListing(listing)) {
      slug = listing.slug;
    } else if (typeof listing === 'object' && listing !== null && 'slug' in listing && typeof (listing as any).slug === 'string') {
      slug = (listing as any).slug;
    }
    return `/listings/${slug || 'default-slug'}`; // Provide a fallback slug
  };

  const getDescription = () => {
    if (isSanityListing(listing)) {
      return listing.descriptionShort || '';
    }
    if (typeof listing === 'object' && listing !== null && 'description_short' in listing && typeof (listing as any).description_short === 'string') {
        return (listing as any).description_short;
    }
    return '';
  };

  const getEcoTags = (): string[] => {
    if (isSanityListing(listing)) {
      return Array.isArray(listing.ecoTags) ? listing.ecoTags : [];
    }
    if (typeof listing === 'object' && listing !== null && 'eco_focus_tags' in listing && Array.isArray((listing as any).eco_focus_tags)) {
        return (listing as any).eco_focus_tags;
    }
    return [];
  };

  return (
    <Link href={getListingUrl()}>
      <div className="group h-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {getImageUrl() ? (
            <Image
              src={getImageUrl()}
              alt={listingName || 'Listing image'} // Fallback for alt text
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setIsError(true);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">{isError ? 'Image unavailable' : (listingName || 'Unnamed Listing')}</span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm">
              {getCategory()}
            </span>
          </div>

          {/* Loading State Overlay */}
          {isLoading && !isError && getImageUrl() && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer" />
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
            {searchQuery
              ? highlightText(listingName || 'Unnamed Listing', searchQuery)
              : (listingName || 'Unnamed Listing')}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-2">
            {searchQuery
              ? highlightText(getDescription(), searchQuery)
              : getDescription()}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {getEcoTags()
              .slice(0, 3)
              .map((tag: string, index: number) => ( // Added types for map callback
                <span
                  key={index}
                  className="px-2 py-1 text-sm bg-green-50 text-green-700 rounded-full"
                >
                  {searchQuery ? highlightText(tag, searchQuery) : tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
