'use client';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { VenueCard } from '@/components/ui/VenueCard';
import type { FeaturedListingDTO } from '@/types/dto';

// Memoized ListingCard component
const ListingCard = memo(
  ({ listing, priority }: { listing: FeaturedListingDTO; priority: boolean }) => (
    <div className="shrink-0 basis-[85%] sm:basis-[60%] lg:basis-1/3">
      <VenueCard venue={listing} priority={priority} className="h-full w-full" />
    </div>
  )
);

ListingCard.displayName = 'ListingCard';

/**
 * Client component for the featured listings carousel.
 * Handles all interactive carousel functionality (navigation, autoplay).
 * Receives pre-fetched listing data from server component.
 */
export function FeaturedListingsCarousel({
  listings,
}: {
  listings: FeaturedListingDTO[];
}): React.JSX.Element {
  // Embla carousel setup
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));
  const [viewportRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      containScroll: 'trimSnaps',
      loop: true,
      skipSnaps: false,
    },
    [autoplay.current]
  );
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Memoized button handlers to reduce re-renders
  const handleMouseEnter = useCallback(() => autoplay.current?.stop(), []);
  const handleMouseLeave = useCallback(() => autoplay.current?.play(), []);

  return (
    <div className="relative">
      {/* Nav buttons */}
      <NeoButton
        variant="secondary"
        size="sm"
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
        aria-label="Scroll featured left"
        onClick={scrollPrev}
        disabled={!canPrev}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ChevronLeft size={18} />
      </NeoButton>
      <NeoButton
        variant="secondary"
        size="sm"
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
        aria-label="Scroll featured right"
        onClick={scrollNext}
        disabled={!canNext}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ChevronRight size={18} />
      </NeoButton>

      {/* Embla viewport & container */}
      <div
        ref={viewportRef}
        className="overflow-hidden"
        role="region"
        aria-label="Featured venues carousel"
      >
        <div className="flex gap-6">
          {listings.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} priority={index < 3} />
          ))}
        </div>
      </div>
    </div>
  );
}
