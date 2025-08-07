import { ListingCard } from '@/components/listings/ListingCard';
import { AppListingCard } from '@/types/appView';
import { Listing as SanityListing } from '../../../sanity.types';

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
    name: listing.name || '',
    slug: (listing as any).slug?.current || (listing as any).slug,
    city: (listing as any).city ? {
      id: (listing as any).city.id,
      name: (listing as any).city.name,
      slug: (listing as any).city.slug?.current || (listing as any).city.slug,
      country: (listing as any).city.country,
    } : null,
    ecoFocusTags: (listing as any).ecoFocusTags || [],
    digitalNomadFeatures: (listing as any).digitalNomadFeatures || [],
    priceRange: (listing as any).priceRange,
    website: (listing as any).website,
    primaryImage: (listing as any).primaryImage,
    galleryImages: (listing as any).galleryImages,
    shortDescription: (listing as any).shortDescription,
    longDescription: (listing as any).longDescription,
    address: (listing as any).address,
    location: (listing as any).location,
  }));

  return (
    <section className="py-16 bg-white relative z-10" aria-labelledby="featured-listings-heading">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h2 id="featured-listings-heading" className="text-3xl font-bold text-gray-900 mb-4">Featured Listings</h2>
          <p className="text-lg text-gray-600">Discover our top eco-friendly accommodations and workspaces</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 p-4 md:p-6">
          {featuredListings.slice(0, 4).map((listing: AppListingCard, index: number) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  )
};
export default FeaturedListings;