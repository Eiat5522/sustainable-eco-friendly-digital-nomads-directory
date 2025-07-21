'use client';

import { SanityListing } from '@/types/sanity';
import { Listing } from '@/types/listing';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingCategory } from '@/types/enums';
import { PriceRange } from '@/types/enums';
// ...existing code...

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

  // Example: Only show listings of certain types (e.g., COWORKING, ACCOMMODATION)
  // You can adjust this filter as needed
  const allowedTypes: ListingCategory[] = [
    ListingCategory.COWORKING,
    ListingCategory.ACCOMMODATION,
    ListingCategory.CAFE,
    ListingCategory.RESTAURANT,
    ListingCategory.ACTIVITIES
  ];

  const filteredListings = listings.filter(
    (listing) => allowedTypes.includes(listing.type as ListingCategory)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {filteredListings.slice(0, 4).map((listing) => {
        // Normalize slug to string if needed
        const normalizedListing: Listing = {
          ...listing,
          slug: typeof listing.slug === 'string' ? listing.slug : listing.slug?.current ?? '',
          type: (Object.values(ListingCategory).includes(listing.type as ListingCategory)
            ? (listing.type as ListingCategory)
            : ListingCategory.COWORKING), // fallback to COWORKING if not valid
          priceRange: (listing.priceRange && Object.values(PriceRange).includes(listing.priceRange as PriceRange)
            ? (listing.priceRange as PriceRange)
            : undefined),
          mainImage: listing.mainImage
            ? {
                asset: {
                  _ref: listing.mainImage.asset._ref,
                  url: listing.mainImage.asset.url ?? '',
                },
              }
            : undefined,
          galleryImages: listing.galleryImages
            ? listing.galleryImages.map(img => ({
                asset: {
                  _ref: img.asset._ref,
                  url: img.asset.url ?? '',
                },
              }))
            : undefined,
        };
        return <ListingCard key={normalizedListing._id} listing={normalizedListing} />;
      })}
    </div>
  );
};

export default FeaturedListings;
