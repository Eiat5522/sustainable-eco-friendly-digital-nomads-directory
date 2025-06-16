import { urlForImage } from '@/lib/sanity/client';
import { type Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';
import Image from 'next/image';
import Link from 'next/link';

interface ListingGridProps {
  listings: (Listing | SanityListing)[];
  useSlug?: boolean;
}

export function ListingGrid({ listings, useSlug = false }: ListingGridProps) {

  // Helper function to get image URL (from Sanity or directly)
  const getImageUrl = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

    try {
      // Handle Sanity listing with primaryImage (from search API)
      if (isSanityListing && 'primaryImage' in listing && listing.primaryImage?.asset?.url) {
        const url = listing.primaryImage.asset.url;
        if (url && typeof url === 'string' && url.startsWith('http')) {
          return url;
        }
      }
      
      // Handle Sanity listing with mainImage (older structure)
      if (isSanityListing && 'mainImage' in listing && listing.mainImage) {
        const url = urlForImage(listing.mainImage)
          .width(800)
          .height(480)
          .fit('crop')
          .auto('format')
          .url();
        if (url && typeof url === 'string' && url.startsWith('http')) {
          return url;
        }
      }
      
      // Handle direct URL from MongoDB or other sources
      const directUrl = (listing as Listing).primary_image_url;
      if (directUrl && typeof directUrl === 'string' && directUrl.startsWith('http')) {
        return directUrl;
      }
    } catch (error) {
      console.warn('Error getting image URL for listing:', listing.name, error);
    }
    
    // Always return a valid fallback
    return '/images/sustainable_nomads.png';
  };

  // Helper to get listing URL (by slug or ID) 
  const getListingUrl = (listing: Listing | SanityListing) => {
    const isSanityListing = '_type' in listing || 'slug' in listing;

    if (isSanityListing && 'slug' in listing) {
      return `/listings/${listing.slug}`;
    }
    return `/listings/${(listing as Listing).slug}`;
  };

  // Helper to get listing ID
  const getListingId = (listing: Listing | SanityListing) => {
    return '_id' in listing ? listing._id : (listing as Listing).id;
  };

  // Helper to get slug string
  const getSlugString = (listing: Listing | SanityListing) => {
    if ('_id' in listing && 'slug' in listing) {
      return listing.slug; // This is already a string from search API
    }
    return (listing as Listing).slug || '';
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
        <div
          key={getListingId(listing)}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out"
        >
          <Link
            href={`/listings/${getSlugString(listing)}`}
            className="group block"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={getImageUrl(listing)}
                alt={listing.name || 'Listing image'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index < 3} // Prioritize loading for the first few images
                onError={(e) => {
                  console.warn('Image failed to load:', getImageUrl(listing));
                  e.currentTarget.src = '/images/sustainable_nomads.png';
                }}
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

          </Link>
          
          <div className="p-6">
            <h3 className="font-bold text-xl mb-2 hover:text-primary-600 transition-colors">
              <Link href={`/listings/${getSlugString(listing)}`}>
                {listing.name}
              </Link>
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {String(getDescription(listing) || '')}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {getEcoTags(listing)?.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={`${getListingId(listing)}-tag-${tagIndex}`}
                  className="inline-block px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded capitalize"
                >
                  {String(tag).replace(/_/g, ' ')}
                </span>
              ))}
              {getEcoTags(listing) && getEcoTags(listing)!.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{getEcoTags(listing)!.length - 3} more
                </span>
              )}
            </div>

            <div className="text-sm text-gray-500">
              <p className="line-clamp-1">{String(getAddress(listing) || '')}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
