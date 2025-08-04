import { ListingCard } from '@/components/listings/ListingCard';
import { AppListingCard } from '@/types/appView';
import { SanityListing } from '@/types/sanity';

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

  const featuredListings: AppListingCard[] = listings.map(listing => ({
    id: (listing as any)._id || (listing as any).id,
    name: listing.name,
    slug: (listing as any).slug?.current || (listing as any).slug,
    city: (listing as any).city ? {
      id: (listing as any).city.id,
      name: (listing as any).city.name,
      slug: (listing as any).city.slug?.current || (listing as any).city.slug,
      country: (listing as any).city.country,
    } : null,
    ecoTags: (listing as any).ecoFocusTags || [],
    priceRange: (listing as any).priceRange,
    website: (listing as any).website,
    primaryImage: (listing as any).primaryImage,
    galleryImages: (listing as any).galleryImages,
    shortDescription: (listing as any).shortDescription,
    longDescription: (listing as any).longDescription,
    address: (listing as any).address,
    coordinates: (listing as any).location,
    category: (listing as any).category,
    contactPhone: (listing as any).contactPhone,
    contactEmail: (listing as any).contactEmail,
    type: (listing as any).type,
    reviews: (listing as any).reviews,
    moderation: (listing as any).moderation,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 p-4 md:p-6">
      {featuredListings.slice(0, 4).map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
};

export default FeaturedListings;
