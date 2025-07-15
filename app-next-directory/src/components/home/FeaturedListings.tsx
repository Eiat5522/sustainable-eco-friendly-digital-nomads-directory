'use client';

import { SanityListing } from '@/types/sanity';
import { Listing } from '@/types/listing';
import { ListingCard } from '@/components/listings/ListingCard';

// Adapter: convert SanityListing to Listing
function mapSanityListingToListing(sanity: SanityListing): Listing {
  return {
    _id: sanity._id,
    name: sanity.name,
    description: sanity.description_short || '',
    type: sanity.category || '',
    mainImage: sanity.primaryImage?.asset?.url || '',
    address: sanity.addressString || '',
    slug: typeof sanity.slug === 'string' ? sanity.slug : sanity.slug?.current || '',
    ecoTags: sanity.ecoTags || [],
    features: sanity.digital_nomad_features || [],
    priceRange: sanity.priceRange || '',
    rating: sanity.rating || 0,
    city: sanity.city?.title || '',
    // Add other fields as needed for ListingCard
  };
}

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
        const normalized = mapSanityListingToListing(listing);
        return <ListingCard key={normalized._id} listing={normalized} />;
      })}
    </div>
  );
};

export default FeaturedListings;
