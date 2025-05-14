import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';
import { urlForImage } from '@/lib/sanity/client';

interface ListingCardProps {
  listing: Listing | SanityListing;
  useSlug?: boolean;
}

export function ListingCard({ listing, useSlug = false }: ListingCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Handle differences between Sanity and regular listing objects
  const isSanityListing = '_type' in listing || 'slug' in listing;
  
  // Get the correct image URL (from Sanity or directly)
  const getImageUrl = () => {
    if (isSanityListing && 'mainImage' in listing && listing.mainImage) {
      return urlForImage(listing.mainImage)
        .width(800)
        .height(480)
        .fit('crop')
        .auto('format')
        .url();
    }
    return (listing as Listing).primary_image_url;
  };

  // Get the listing URL (by slug or ID)
  const getListingUrl = () => {
    if (useSlug && isSanityListing && 'slug' in listing) {
      return `/listings/${listing.slug}`;
    }
    return `/listings/${(listing as Listing).id || (listing as SanityListing)._id}`;
  };

  // Get description field (different field names in different models)
  const getDescription = () => {
    return isSanityListing && 'descriptionShort' in listing
      ? listing.descriptionShort
      : (listing as Listing).description_short;
  };

  // Get eco tags (different field names in different models)
  const getEcoTags = () => {
    return isSanityListing && 'ecoTags' in listing
      ? listing.ecoTags
      : (listing as Listing).eco_focus_tags;
  };

  return (
    <>
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      <Link href={getListingUrl()} className="block h-full">
        <article className="h-full transition-transform hover:scale-[1.02] duration-200">
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
                    alt={listing.name}
                    fill
                    className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={80}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0dHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//2wBDAR0XFyMeIyEeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyP/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    onLoadingComplete={() => setIsLoading(false)}
                    onError={() => setIsError(true)}
                    loading="lazy"
                  />
                  {isError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-200 dark:bg-slate-700">
                      <span className="text-stone-400 dark:text-slate-500">Failed to load image</span>
                    </div>
                  )}
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
                  listing.category === 'coworking' 
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                    : listing.category === 'cafe'
                    ? 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100'
                    : 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100'
                }`}>
                  {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{listing.name}</h3>
              
              {/* Location */}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {isSanityListing ? listing.city : (listing as Listing).city}
              </p>

              {/* Short Description */}
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-2 flex-grow">
                {getDescription()}
              </p>

              {/* Eco Tags */}
              {getEcoTags() && getEcoTags().length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {getEcoTags().slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2.5 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full"
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {getEcoTags().length > 3 && (
                    <span className="inline-block px-2.5 py-1 text-xs bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200 rounded-full">
                      +{getEcoTags().length - 3}
                    </span>
                  )}
                </div>
              )}              {/* Digital Nomad Features */}
              {(() => {
                const features = isSanityListing && 'nomadFeatures' in listing 
                  ? listing.nomadFeatures 
                  : (listing as Listing).digital_nomad_features;
                
                return features && features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {features.slice(0, 2).map((feature: string) => (
                      <span
                        key={feature}
                        className="inline-block px-2.5 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full"
                      >
                        {feature.replace(/_/g, ' ')}
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
