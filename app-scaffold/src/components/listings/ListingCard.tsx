"use client";
import { highlightText } from '@/lib/highlight';
import { urlFor } from '@/lib/sanity/client';
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

  // Extract listing name safely for use in title and alt
  const listingName =
    typeof listing === 'object' && 'name' in listing && typeof listing.name === 'string'
      ? listing.name
      : '';

  // Type guard for SanityListing
  const isSanityListing = (listing: Listing | SanityListing): listing is SanityListing => {
    return (
      typeof listing === 'object' &&
      '_type' in listing &&
      listing._type === 'listing'
    );
  };

  // Get the category safely
  const getCategory = () => {
    if (isSanityListing(listing)) {
      return listing.category || 'Other';
    }
    if (typeof listing === 'object' && 'type' in listing && typeof listing.type === 'string') {
      return listing.type;
    }
    return 'Other';
  };

  // Get the correct image URL (from Sanity or directly)
  const getImageUrl = () => {
    if (isSanityListing(listing)) {
      if (listing.mainImage) {
        return urlFor(listing.mainImage)
          .width(800)
          .height(480)
          .fit('crop')
          .auto('format')
          .url();
      }
    } else {
      return listing.primary_image_url;
    }
    return '';
  };

  // Get the listing URL using the slug
  const getListingUrl = () => {
    if (isSanityListing(listing)) {
      return `/listings/${listing.slug?.current || ''}`;
    }
    return `/listings/${typeof listing.slug === 'string' ? listing.slug : ''}`;
  };

  // Get description field (different field names in different models)
  const getDescription = () => {
    if (isSanityListing(listing)) {
      return listing.descriptionShort || '';
    }
    return listing.description_short || '';
  };

  // Get eco tags (different field names in different models)
  const getEcoTags = (): string[] => {
    if (isSanityListing(listing)) {
      return Array.isArray(listing.ecoTags) ? listing.ecoTags : [];
    }
    return Array.isArray(listing.eco_focus_tags)
      ? listing.eco_focus_tags
      : [];
  };


  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        :global(.animate-shimmer) {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
      <Link href={getListingUrl()} className="block h-full">
        <article className="h-full transition-transform hover:scale-[1.02] duration-200" data-testid="listing-card">
          <div className="relative bg-stone-50 dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl overflow-hidden h-full border border-stone-200 dark:border-slate-700 hover:border-green-600 dark:hover:border-green-500 transition-all duration-300">
            {/* Image */}
            <div className="relative h-48 w-full bg-stone-200 dark:bg-slate-700">
              {getImageUrl() ? (
                <>
                  {/* Loading Shimmer */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                      ${isLoading ? 'animate-shimmer opacity-100' : 'opacity-0'}`}
                    style={{
                      backgroundSize: '200% 100%'
                    }}
                  />
                  <Image
                    src={getImageUrl()}
                    alt={listingName || 'Listing image'}
                    fill
                    className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={80}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJbWFlaIAAAAAAAAG+gAAA49QAAA5BYWVigAAAAAAAAYpkAALeFAAAY2lhZWiAAAAAAAAAkoAAAD4QAALbPY3VydgAAAAAAAAAaAAAAywHJA2MFkghrC/YQPxVRGzQh8SmQMhg7kkYFUXdd7WtwegWJsZp8rGm/fdPD6TD////bAIQABQYGBwkHCgsLCg0ODQ4NExIQEBITHRUWFRYVHSsbIBsbIBsrJi4mIyYuJkQ2MDA2RE9CP0JPX1VVX3hyeJyc0gEFBgYHCQcKCwsKDQ4NDg0TEhAQEhMdFRYVFhUdKxsgGxsgGysmLiYjJi4mRDYwMDZET0I/Qk9fVVVfeHJ4nJzS"
                    onLoadStart={() => setIsLoading(true)}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsError(true)}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-stone-400 dark:text-slate-500">No image available</span>
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
              {/* Category Badge */}
              <div className="mb-2">
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                  getCategory() === 'coworking'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                    : getCategory() === 'cafe'
                    ? 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100'
                    : 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100'
                }`}>
                  {getCategory().charAt(0).toUpperCase() + getCategory().slice(1)}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1" data-testid="listing-title">
                {searchQuery && listingName ? highlightText(listingName, searchQuery) : listingName}
              </h3>

              {/* Location */}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {typeof listing === 'object' && 'city' in listing && typeof listing.city === 'string'
                  ? listing.city
                  : ''}
              </p>

              {/* Short Description */}
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-2 flex-grow" data-testid="listing-description">
                {searchQuery ? highlightText(getDescription(), searchQuery) : getDescription()}
              </p>

              {/* Eco Tags */}
              {getEcoTags().length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {getEcoTags().slice(0, 3).map((tag: string) => (
                    <span
                      key={typeof tag === 'string' ? tag : ''}
                      data-testid="eco-tag"
                      className="inline-block px-2.5 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full"
                    >
                      {typeof tag === 'string'
                        ? (searchQuery ? highlightText(tag.replace(/_/g, ' '), searchQuery) : tag.replace(/_/g, ' '))
                        : ''}
                    </span>
                  ))}
                  {getEcoTags().length > 3 && (
                    <span className="inline-block px-2.5 py-1 text-xs bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200 rounded-full">
                      +{getEcoTags().length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Digital Nomad Features */}
              {(() => {
                const features = isSanityListing(listing)
                  ? listing.nomadFeatures || []
                  : listing.digital_nomad_features || [];

                return Array.isArray(features) && features.filter(f => typeof f === 'string').length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {features
                      .filter((f): f is string => typeof f === 'string')
                      .slice(0, 2)
                      .map((feature) => (
                        <span
                          key={feature}
                          data-testid="nomad-feature"
                          className="inline-block px-2.5 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full"
                        >
                          {searchQuery
                            ? highlightText(feature.replace(/_/g, ' '), searchQuery)
                            : feature.replace(/_/g, ' ')}
                        </span>
                      ))}
                    {features.length > 2 && (
                      <span className="inline-block px-2.5 py-1 text-xs bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200 rounded-full">
                        +{features.length - 2}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </article>
      </Link>
    </>
  );
}
