import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { urlFor } from '@/lib/sanity/image';
import { AppListingCard } from '@/types/appView';
import type { ListingCardProps } from '@/components/listings/ListingCard';

// Code-split ListingCard to avoid loading it when not rendering the home variant
import { Suspense } from 'react';

const DynamicListingCard = dynamic<ListingCardProps>(
  () => import('@/components/listings/ListingCard').then(m => m.ListingCard as any)
);


interface FeaturedListingsProps {
  listings: AppListingCard[];
  variant?: 'home' | 'listings';
  searchQuery?: string;
}

export default function FeaturedListings({ listings, variant = 'listings', searchQuery }: FeaturedListingsProps) {
  const isHome = variant === 'home';

  // Suppress empty message on Home variant to avoid flashing on initial load
  if (!listings || listings.length === 0) {
    if (isHome) {
      return null;
    }
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-center text-gray-600">No featured listings available at the moment.</p>
        </div>
      </section>
    );
  }
  return (
    <section className={isHome ? 'py-16 bg-white relative z-10' : 'py-12 bg-gray-50'}>
      <div className="container mx-auto px-4">
        <h2 className={isHome ? 'text-3xl font-bold text-gray-900 mb-4 text-center' : 'text-3xl font-bold mb-10 text-center text-gray-800'}>Featured Listings</h2>
        {isHome && <p className="text-lg text-gray-600 mb-8 text-center">Discover our top eco-friendly accommodations and workspaces</p>}
        <div className={isHome ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 p-4 md:p-6' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'}>
          {(() => {
            const displayListings = isHome ? listings.slice(0, 4) : listings;
            return displayListings.map(listing => {
            // Guard against missing slugs to avoid bad URLs
            if (!listing?.slug || typeof listing.slug !== 'string' || listing.slug.trim() === '') {
              return null;
            }

            if (isHome) {
              return (
                <Suspense key={listing.id} fallback={<div className="flex items-center justify-center h-32"><span>Loading...</span></div>}>
                  <DynamicListingCard listing={listing} searchQuery={searchQuery} />
                </Suspense>
              );
            }

            // Compute imageUrl only for non-home variant
            let imageUrl = '/images/fallback.png';
            // Prefer direct DTO imageUrl if provided
            if (listing.imageUrl) {
              imageUrl = listing.imageUrl;
            } else if (listing.primaryImage?.asset) {
              try {
                const sanityImageUrl = urlFor(listing.primaryImage)
                  ?.width(500)
                  .height(300)
                  .fit('crop')
                  .auto('format')
                  .url();
                if (sanityImageUrl) imageUrl = sanityImageUrl;
              } catch (error) {
                console.warn('Failed to generate Sanity image URL for listing:', listing.id, error);
              }
            } else if (listing.galleryImages && listing.galleryImages.length > 0 && listing.galleryImages[0]?.asset) {
              try {
                const sanityImageUrl = urlFor(listing.galleryImages[0])
                  ?.width(500)
                  .height(300)
                  .fit('crop')
                  .auto('format')
                  .url();
                if (sanityImageUrl) imageUrl = sanityImageUrl;
              } catch (error) {
                console.warn('Failed to generate Sanity gallery image URL for listing:', listing.id, error);
              }
            }
            // FORTEST: Ensure all listing types are handled for image selection
            // TODO: Audit for new types in LISTING_TYPES and add custom logic if needed

            return (
              <article
                key={listing.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col"
              >
                <Link href={`/listings/${listing.slug}`} className="block group">
                  <div className="relative w-full h-56 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={listing.name}
                      width={500}
                      height={300}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      className="group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33.333vw"
                      priority={true}
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        console.warn('Featured image failed to load:', imageUrl);
                        e.currentTarget.src = '/images/fallback.png';
                      }}
                    />
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="hover:text-green-600 transition-colors duration-200 line-clamp-2"
                    >
                      {listing.name}
                    </Link>
                  </h3>
                  {(listing.city?.name || listing.city?.country) && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                      {[listing.city?.name, listing.city?.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      {listing.priceRange && (
                        <span className="text-lg font-bold text-green-600">
                          {listing.priceRange}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="block w-full text-center bg-green-500 text-white py-2.5 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            );
            });
          })()}
        </div>
      </div>
    </section>
  );
}

