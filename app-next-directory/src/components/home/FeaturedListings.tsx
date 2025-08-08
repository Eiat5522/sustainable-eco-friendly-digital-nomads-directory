import { ListingCard } from '@/components/listings/ListingCard';
import { AppListingCard } from '@/types/appView';
import { mapSanityListingToCard } from '@/lib/listings';

interface FeaturedListingsProps {
  listings: any[]; // Raw Sanity listings
}

const FeaturedListings: React.FC<FeaturedListingsProps> = ({ listings }) => {
  if (!listings || listings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No featured listings available at the moment.
      </div>
    );
  }

  // Map raw Sanity listings to AppListingCard DTOs using the mapping helper
  const featuredListings: AppListingCard[] = listings
    .map(listing => {
      try {
        return mapSanityListingToCard(listing);
      } catch (error) {
        console.warn('Failed to map listing:', listing._id, error);
        return null;
      }
    })
    .filter((listing): listing is AppListingCard => listing !== null);

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