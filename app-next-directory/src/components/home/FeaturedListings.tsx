'use client';

import { SanityListing } from '@/types/sanity';
import { Listing } from '@/types/listing';
import { ListingCategory, PriceRange } from '@/types/enums';
import { ListingCard } from '@/components/listings/ListingCard';

interface FeaturedListingsProps {
  listings: SanityListing[];
}

const FeaturedListings: React.FC<FeaturedListingsProps> = ({ listings }) => {
  if (!listings || listings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No featured listings available at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {listings.slice(0, 4).map((listing) => {
        // Ensure slug is a string for ListingCard
        const normalizedListing: Listing = {
          ...listing,
          address: typeof listing.address === 'string' ? listing.address : '',
          ecoTags: Array.isArray(listing.ecoTags)
            ? listing.ecoTags.map(tag => ({
                ...tag,
                slug: tag.slug && typeof tag.slug.current === 'string'
                  ? { current: tag.slug.current }
                  : { current: String(tag.slug?.current ?? '') },
                description: typeof tag.description === 'string' ? tag.description : '',
                listingCount: typeof tag.listingCount === 'number' ? tag.listingCount : 0
              }))
            : [],
          city: listing.city
            ? {
                _id: listing.city._id ?? '',
                name: listing.city.name ?? '',
                slug: typeof listing.city.slug === 'object' && listing.city.slug !== null
                  ? { current: String(listing.city.slug.current ?? '') }
                  : { current: String(listing.city.slug ?? '') },
                listingCount: typeof listing.city.listingCount === 'number' ? listing.city.listingCount : 0,
                country: listing.city.country ?? ''
              }
            : undefined,
          slug: typeof listing.slug === 'object' && listing.slug !== null ? listing.slug : { current: String(listing.slug) },
          type: listing.type ?? ListingCategory.COWORKING,
          priceRange: Object.values(PriceRange).includes(listing.priceRange as PriceRange)
            ? (listing.priceRange as PriceRange)
            : undefined,
          mainImage: listing.mainImage && listing.mainImage.asset && typeof listing.mainImage.asset.url === 'string'
            ? { asset: { _ref: listing.mainImage.asset._ref, url: listing.mainImage.asset.url } }
            : undefined,
galleryImages: Array.isArray(listing.galleryImages)
            ? listing.galleryImages
                .map(img =>
                  img && img.asset && typeof img.asset.url === 'string'
                    ? { asset: { _ref: img.asset._ref, url: img.asset.url } }
                    : null
                )
                .filter((img): img is { asset: { _ref: string; url: string } } => img !== null)
            : [],
        };
        return <ListingCard key={normalizedListing._id} listing={normalizedListing} />;
      })}
    </div>
  );
};

export default FeaturedListings;
