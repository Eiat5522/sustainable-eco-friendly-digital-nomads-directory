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
    <section className="relative overflow-hidden bg-neo-secondary px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="container relative z-10 mx-auto max-w-6xl">
        <div
          className="overflow-hidden border-4 border-neo-border bg-neo-surface p-6 md:p-8"
          style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
        >
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
      </div>
    </section>
  );
}
