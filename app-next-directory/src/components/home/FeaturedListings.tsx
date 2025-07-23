'use client';

import { SanityListing } from '@/types/sanity';
import { Listing } from '@/types/listing';
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
          slug: typeof listing.slug === 'object' && listing.slug !== null ? listing.slug : { current: String(listing.slug) },
          type: listing.type ?? 'coworking', // fallback to a valid ListingType value
        };
        return <ListingCard key={normalizedListing._id} listing={normalizedListing} />;
      })}
    </div>
  );
};

export default FeaturedListings;
