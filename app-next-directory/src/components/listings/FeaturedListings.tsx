'use client';

import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/client';

// Define a more accurate type for a dereferenced Sanity image asset
interface SanityImageAsset {
  _id: string; // Asset ID, equivalent to what _ref would point to
  _type: 'sanity.imageAsset';
  url: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
  originalFilename?: string;
  metadata?: {
    lqip?: string;
    blurHash?: string;
    dimensions?: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    palette?: any; // Can be more specific if needed
    hasAlpha?: boolean;
    isOpaque?: boolean;
  };
  // ... any other fields your assets might have
}

interface ListingImage {
  _type: 'image'; // Typically 'image' for the image field itself
  alt?: string;
  asset: SanityImageAsset; // Use the more accurate asset type
  hotspot?: any; // Add other common image fields if used
  crop?: any;
}

interface City {
  _id: string;
  name: string;
  country: string;
}

interface Listing {
  _id: string;
  name: string;
  slug: string;
  primaryImage?: ListingImage;
  galleryImages?: ListingImage[];
  location?: City;
  price?: number;
}

interface FeaturedListingsProps {
  listings: Listing[];
}

export default function FeaturedListings({ listings }: FeaturedListingsProps) {
  console.log('[DEBUG] FeaturedListings: Component rendered with', listings?.length || 0, 'listings');
  console.log('[DEBUG] FeaturedListings: Listings structure check:', {
    isArray: Array.isArray(listings),
    hasListings: !!listings,
    firstListingId: listings?.[0]?._id,
    firstListingName: listings?.[0]?.name,
    firstListingSlug: listings?.[0]?.slug
  });

  const getImageUrl = (listing: Listing): string => {
    // console.log('getImageUrl - Processing listing:', JSON.stringify(listing, null, 2)); // Removed debugging log
    // Condition changed: Check for existence of asset object (and its url or _id for robustness)
    // since asset-> in GROQ returns the full asset document, not just a reference.
    if (listing.primaryImage?.asset?.url) { 
      // console.log(`getImageUrl - Found primaryImage for ${listing.name} using asset.url:`, listing.primaryImage.asset.url); // Removed debugging log
      return urlFor(listing.primaryImage).width(500).height(300).url();
    }
    if (listing.galleryImages?.[0]?.asset?.url) {
      // console.log(`getImageUrl - Found galleryImage for ${listing.name} using asset.url:`, listing.galleryImages[0].asset.url); // Removed debugging log
      return urlFor(listing.galleryImages[0]).width(500).height(300).url();
    }
    // console.log(`getImageUrl - No image found for ${listing.name}, returning placeholder.`); // Removed debugging log
    return '/placeholder-city.jpg'; // Return placeholder image URL
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
            // console.log(`FeaturedListings - Rendering Image for "${listing.name}": imageUrl is "${imageUrl}" (type: ${typeof imageUrl})`); // Removed targeted log

            return (
              <article
                key={listing._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col"
              >
                <Link href={`/listings/${listing.slug}`} className="block group">
                  <div className="relative w-full h-56 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={listing.primaryImage?.alt || listing.name}
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
                        onError={(e) => {
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
                      href={`/listings/${listing.slug}`}
                      className="hover:text-green-600 transition-colors duration-200 line-clamp-2"
                    >
                      {listing.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                    {listing.location?.name}, {listing.location?.country}
                  </p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-green-600">
                        {listing.price ? `$${listing.price}` : ''}
                      </span>
                      {listing.price && <span className="text-xs text-gray-500">/night</span>}
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
          })}
        </div>
      </div>
    </section>
  );
}
