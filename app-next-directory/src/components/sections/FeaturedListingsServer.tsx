import { SectionHeader } from '@/components/ui/SectionHeader';
import type { FeaturedListingDTO } from '@/types/dto';
import { FeaturedListingsCarousel } from './FeaturedListingsCarousel';

/**
 * Server component for featured listings section.
 * Receives pre-fetched data from the page and delegates carousel rendering
 * to the client component.
 * 
 * This component is intentionally kept as a server component to:
 * 1. Minimize client-side JavaScript bundle
 * 2. Render static shell (section header) immediately
 * 3. Keep data transformation server-side
 */
export function FeaturedListings({
  listings,
}: {
  listings: FeaturedListingDTO[];
}): React.JSX.Element {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Featured Sustainable Venues"
          description="Handpicked eco-friendly spaces that prioritize sustainability without compromising on quality"
        />

        {listings.length === 0 ? (
          <div className="text-center">
            <p className="body-lg">No featured listings available at the moment.</p>
          </div>
        ) : (
          <FeaturedListingsCarousel listings={listings} />
        )}
      </div>
    </section>
  );
}
