'use client';

import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/image';
import { Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';

interface FeaturedListingsProps {
  listings: Array<Listing | SanityListing>;
}

export default function FeaturedListings({ listings }: FeaturedListingsProps) {
  console.log('[DEBUG] FeaturedListings: Component rendered with', listings?.length || 0, 'listings');
  console.log('[DEBUG] FeaturedListings: Listings structure check:', {
    isArray: Array.isArray(listings),
    hasListings: !!listings,
    firstListingId: listings?.[0] && ('_id' in listings[0]) ? listings[0]._id : listings?.[0] && ('id' in listings[0]) ? listings[0].id : 'N/A',
    firstListingName: listings?.[0]?.name,
    firstListingSlug: listings?.[0]?.slug
  });

  // Helper functions to safely access union type properties
  const getListingId = (listing: Listing | SanityListing): string => {
    return ('_id' in listing) ? listing._id : (listing as any).id ?? '';
  };

  const getListingSlug = (listing: Listing | SanityListing): string => {
    if (typeof listing.slug === 'string') {
      return listing.slug;
    }
    if (typeof listing.slug === 'object' && listing.slug && 'current' in listing.slug) {
      return listing.slug.current || '';
    }
    return listing.slug || '';
  };

  const getListingLocation = (listing: Listing | SanityListing): string => {
    if ('city' in listing && typeof listing.city === 'object' && listing.city) {
      // Handle city object with possible 'title' or fallback to 'name'
      return (listing.city && ('title' in listing.city) ? (listing.city as any).title : listing.city?.name) || 'Location not specified';
    }
    if ('city' in listing && typeof listing.city === 'string') {
      return listing.city;
    }
    return 'Location not specified';
  };

  const getListingPrice = (listing: Listing | SanityListing): number | undefined => {
    return ('price' in listing) ? listing.price : undefined;
  };

  const getImageUrl = (listing: Listing | SanityListing): string => {
    // Handle Sanity listing format first (with detailed image structure)
    if ('mainImage' in listing && listing.mainImage && typeof listing.mainImage === 'object' && 'asset' in listing.mainImage) {
      const builder = urlFor(listing.mainImage);
      if (builder) {
        return builder.width(500).height(300).url();
      }
    }
    
    // Handle simplified Listing format (string URL)
    if ('mainImage' in listing && listing.mainImage) {
      // Handle mainImage as string or object
      return typeof listing.mainImage === 'string' ? listing.mainImage : (listing.mainImage?.asset?.url ?? '');
    }
    
    // Check for gallery images in Sanity format
    if ('galleryImages' in listing && listing.galleryImages?.[0]) {
      const galleryImage = listing.galleryImages[0];
      if (galleryImage && typeof galleryImage === 'object' && 'asset' in galleryImage) {
        const builder = urlFor(galleryImage);
        if (builder) {
          return builder.width(500).height(300).url();
        }
      }
    }
    
    // Check for gallery images in simplified format
    if ('galleryImages' in listing && listing.galleryImages?.[0]) {
      // Handle galleryImages[0] as string or object
      const img = listing.galleryImages?.[0];
      return typeof img === 'string' ? img : (img?.asset?.url ?? '');
    }
    
    // Fallback placeholder
    return '/placeholder-city.jpg';
  };

  if (!listings || listings.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-center text-gray-600">No featured listings available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">Featured Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {listings.slice(0, 4).map(listing => {
            const imageUrl = getImageUrl(listing);
            const listingId = getListingId(listing);
            const listingSlug = getListingSlug(listing);
            const listingLocation = getListingLocation(listing);
            const listingPrice = getListingPrice(listing);
            // console.log(`FeaturedListings - Rendering Image for "${listing.name}": imageUrl is "${imageUrl}" (type: ${typeof imageUrl})`); // Removed targeted log

            return (
              <article
                key={listingId}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col"
              >
                <Link href={`/listings/${listingSlug}`} className="block group">
                  <div className="relative w-full h-56 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={
                          ('primaryImage' in listing && listing.primaryImage && typeof listing.primaryImage === 'object' && 'alt' in listing.primaryImage) 
                            ? listing.primaryImage.alt || listing.name 
                            : listing.name
                        }
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
                          e.currentTarget.src = '/images/sustainable_nomads.png';
                        }}
                      />

                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image available</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    <Link
                      href={`/listings/${listingSlug}`}
                      className="hover:text-green-600 transition-colors duration-200 line-clamp-2"
                    >
                      {listing.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                    {listingLocation}
                  </p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-green-600">
                        {listingPrice ? `$${listingPrice}` : ''}
                      </span>
                      {listingPrice && <span className="text-xs text-gray-500">/night</span>}
                    </div>
                    <Link
                      href={`/listings/${listingSlug}`}
                      className="block w-full text-center bg-green-500 text-white py-2.5 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
