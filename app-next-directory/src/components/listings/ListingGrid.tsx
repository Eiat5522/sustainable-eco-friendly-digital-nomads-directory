import { urlForImage } from '@/lib/sanity/client';
import { type Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

interface ListingGridProps {
  listings: (Listing | SanityListing)[];
  useSlug?: boolean;
}

export function ListingGrid({ listings, useSlug = false }: ListingGridProps) {
  // Fix the ref issue - change from string to proper ref
  const observerRef = useRef<HTMLDivElement>(null);

  // Helper function to get image URL (from Sanity or directly)
  const getImageUrl = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

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

  // Helper to get listing URL (by slug or ID)
  const getListingUrl = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

    if (useSlug && isSanityListing && 'slug' in listing) {
      return `/listings/${listing.slug}`;
    }
    return `/listings/${(listing as Listing).slug?.current || (listing as SanityListing).slug.current}`;
  };

  // Helper to get eco tags (different field names in different models)
  const getEcoTags = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

    return isSanityListing && 'ecoTags' in listing
      ? listing.ecoTags
      : (listing as Listing).eco_focus_tags;
  };

  // Helper to get location/city
  const getLocation = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

    return isSanityListing
      ? listing.city
      : (listing as Listing).city;
  };

  // Helper to get description
  const getDescription = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

    return isSanityListing && 'descriptionShort' in listing
      ? listing.descriptionShort
      : (listing as Listing).description_short;
  };

  // Helper to get address
  const getAddress = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

    return isSanityListing && 'address' in listing
      ? listing.address
      : (listing as Listing).address_string;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing, index) => (
        <Link
          key={listing.id}
          href={`/listings/${listing.slug}`}
          className="group block transform transition-all duration-300 hover:scale-105"
        >
          <div style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="relative h-48 rounded-lg">
              <Image
                src={getImageUrl(listing)}
                alt={listing.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute top-4 right-4 z-10">
                <span className={`
                  inline-block px-3 py-1 text-sm font-medium rounded-full
                  ${listing.category === 'coworking' ? 'bg-category-coworking text-white' :
                    listing.category === 'cafe' ? 'bg-category-cafe text-white' :
                    'bg-category-accommodation text-white'}
                  shadow-sm
                `}>
                  {listing.category}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold text-xl mb-2 group-hover:text-primary-600 transition-colors">
                {listing.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {getDescription(listing)}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {getEcoTags(listing)?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded capitalize"
                  >
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
                {getEcoTags(listing)?.length > 3 && (
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    +{getEcoTags(listing).length - 3} more
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-500">
                <p className="line-clamp-1">{getAddress(listing)}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
