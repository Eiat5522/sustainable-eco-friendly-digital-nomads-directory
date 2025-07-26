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
          ecoTags: Array.isArray(listing.ecoTags)
            ? listing.ecoTags.filter(tag => tag && typeof tag === 'object' && '_id' in tag && 'name' in tag && 'slug' in tag)
            : [],
          city: listing.city && typeof listing.city === 'object' && '_id' in listing.city && 'name' in listing.city && 'slug' in listing.city && '_type' in listing.city
            ? listing.city
            : undefined,
          slug: typeof listing.slug === 'object' && listing.slug !== null && 'current' in listing.slug
            ? listing.slug
            : undefined,
          // Remove all non-canonical fields (no priceRange, mainImage)
          galleryImages: Array.isArray(listing.galleryImages)
            ? listing.galleryImages.filter(img => img && typeof img === 'object' && 'asset' in img && img.asset && '_ref' in img.asset)
            : [],
        };
        return <ListingCard key={canonicalListing._id} listing={canonicalListing} />;
      })}
    </div>
  );
};

export default FeaturedListings;
