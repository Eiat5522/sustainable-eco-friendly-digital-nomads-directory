'use client';

import { SanityListing } from '@/types/sanity';
import { ListingCard } from '@/components/listings/ListingCard';

interface FeaturedListingsProps {
  listings: SanityListing[];
}

export default function FeaturedListings({ listings }: FeaturedListingsProps) {
  if (!listings || listings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No featured listings available at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {listings.slice(0, 4).map((listing) => (
        <ListingCard key={listing._id} listing={listing} />
      ))} // Added a comment
    </div>
  );
}
