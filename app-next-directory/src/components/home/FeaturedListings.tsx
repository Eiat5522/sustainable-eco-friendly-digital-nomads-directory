'use client';

import type { Listing as SanityListing, City, EcoTag } from '../../../../sanity/sanity.types';
// Use canonical types only

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
        // Canonicalize listing for ListingCard
        const canonicalListing: SanityListing = {
          ...listing,
          address: typeof listing.address === 'string' ? listing.address : '',
          ecoFocusTags: Array.isArray(listing.ecoFocusTags) ? listing.ecoFocusTags.map(tag => (tag as any).name) : [],
          digitalNomadFeatures: Array.isArray(listing.digitalNomadFeatures) ? listing.digitalNomadFeatures.map(feature => (feature as any).name) : [],
          priceRange: listing.priceRange,
          city: listing.city && typeof listing.city === 'object' && '_id' in listing.city && 'name' in listing.city && 'slug' in listing.city && '_type' in listing.city
            ? listing.city
            : undefined,
          slug: typeof listing.slug === 'object' && listing.slug !== null && 'current' in listing.slug
            ? listing.slug
            : undefined,
          primaryImage: listing.primaryImage,
        };
        return <ListingCard key={canonicalListing._id} listing={canonicalListing} />;
      })}
    </div>
  );
};

export default FeaturedListings;
