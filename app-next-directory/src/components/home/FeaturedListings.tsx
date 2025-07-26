'use client';

import type { Listing as SanityListing, City, EcoTag } from '../../../../sanity/sanity.types';
// Use canonical types only

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
        const normalizedListing: SanityListing = {
          ...listing,
          address: typeof listing.address === 'string' ? listing.address : '',
          ecoTags: Array.isArray(listing.ecoTags)
            ? listing.ecoTags.filter(tag => tag && typeof tag === 'object' && '_id' in tag && 'name' in tag)
            : [],
          city: listing.city && typeof listing.city === 'object' && '_id' in listing.city && 'name' in listing.city
            ? listing.city
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
