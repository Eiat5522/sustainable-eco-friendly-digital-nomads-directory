import { AppListingCard } from "@/types/appView";
import { ListingGrid } from "@/components/listings/ListingGrid";

interface FeaturedListingsSectionProps {
  listings: AppListingCard[];
}

export default function FeaturedListingsSection({ listings }: FeaturedListingsSectionProps) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold mb-8">Featured Listings</h2>
        <ListingGrid listings={listings} />
      </div>
    </section>
  );
}

