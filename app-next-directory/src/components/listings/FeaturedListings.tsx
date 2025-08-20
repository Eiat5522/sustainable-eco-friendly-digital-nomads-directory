import { useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { FeaturedListingDTO } from '@/types/dto';

interface FeaturedListingsProps {
  listings: FeaturedListingDTO[];
  variant?: 'home' | 'listings';
  searchQuery?: string;
}

/**
 * ListingCard - extracted child component so hooks are only used at component top-level.
 * Inputs:
 *  - listing: FeaturedListingDTO
 * Behavior:
 *  - Manages image src state and onError fallback
 *  - Renders the card UI previously inline in the map callback
 */
function ListingCard({ listing }: { listing: FeaturedListingDTO }) {
  const [imageSrc, setImageSrc] = useState(listing.imageUrl || '/images/fallback.png');

  return (
    <article
      key={listing.id}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col"
    >
      <Link href={`/listings/${listing.slug}`} className="block group">
        <div className="relative w-full h-56 overflow-hidden">
          <Image
            src={imageSrc}
            alt={listing.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33.333vw"
            priority={true}
            onError={() => setImageSrc('/images/fallback.png')}
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

        {listing.city && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {listing.city}
          </p>
        )}

        {listing.amenityNames && listing.amenityNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.amenityNames.slice(0, 3).map((amenity) => (
              <span 
                key={`${listing.id}-${amenity}`}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
              >
                {amenity}
              </span>
            ))}
            {listing.amenityNames.length > 3 && (
              <span className="text-xs text-gray-500">
                +{listing.amenityNames.length - 3} more
              </span>
            )}
          </div>
        )}
        <div className="mt-auto">
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
}

export default function FeaturedListings({ 
  listings, 
  variant = 'listings', 
  searchQuery 
}: FeaturedListingsProps) {
  const isHome = variant === 'home';

  if (!listings || listings.length === 0) {
    if (isHome) return null;
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
        <h2 className={isHome ? 'text-3xl font-bold text-gray-900 mb-4 text-center' : 'text-3xl font-bold mb-10 text-center text-gray-800'}>
          Featured Listings
        </h2>
        {isHome && (
          <p className="text-lg text-gray-600 mb-8 text-center">
            Discover our top eco-friendly accommodations and workspaces
          </p>
        )}
        
        <div className={isHome 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 p-4 md:p-6' 
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
        }>
          {listings
            .filter(listing => listing?.slug && listing.slug.trim() !== '')
            .slice(0, isHome ? 4 : listings.length)
            .map((listing, index) => (
              <ListingCard listing={listing} key={listing.id ?? listing.slug ?? index} />
            ))}
        </div>
      </div>
    </section>
  );
}
