'use client';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { VenueCard } from '@/components/ui/VenueCard';
import type { FeaturedListingDTO } from '@/types/dto';

type FeaturedListingResponse = {
  listings?: unknown;
  data?: {
    listings?: unknown;
  };
};

// Optimized helper functions - moved outside component
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(isNonEmptyString);
};

// Memoized data transformation function
function toFeaturedListing(listing: unknown): FeaturedListingDTO | null {
  if (!listing || typeof listing !== 'object') {
    return null;
  }

  const candidate = listing as Record<string, unknown>;

  const id = candidate.id;
  const name = candidate.name;
  const slug = candidate.slug;
  const imageUrl = candidate.imageUrl;
  const city = candidate.city;
  const amenityNames = candidate.amenityNames;
  const ecoFocusTags = candidate.ecoFocusTags;
  const featured = candidate.featured;

  if (!isNonEmptyString(id) || !isNonEmptyString(name) || !isNonEmptyString(slug)) {
    return null;
  }

  let cityName = '';
  if (isNonEmptyString(city)) {
    cityName = city;
  } else if (city && typeof city === 'object') {
    const possibleName = (city as { name?: unknown }).name;
    if (isNonEmptyString(possibleName)) {
      cityName = possibleName;
    }
  }

  return {
    id,
    name,
    slug,
    imageUrl: isNonEmptyString(imageUrl) ? imageUrl : undefined,
    city: cityName,
    amenityNames: toStringArray(amenityNames),
    ecoFocusTags: toStringArray(ecoFocusTags),
    featured: typeof featured === 'boolean' ? featured : undefined,
  };
}

// Memoized ListingCard component
const ListingCard = memo(({ listing, priority }: { listing: FeaturedListingDTO; priority: boolean }) => (
  <div className="shrink-0 basis-[85%] sm:basis-[60%] lg:basis-1/3">
    <VenueCard venue={listing} priority={priority} className="h-full w-full" />
  </div>
));

ListingCard.displayName = 'ListingCard';

export function FeaturedListings(): React.JSX.Element {
  const [listings, setListings] = useState<FeaturedListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const DEFAULT_ERROR_MESSAGE = 'Failed to load featured listings. Please try again.';

  // NOTE: All hooks must be declared unconditionally and before any early returns
  // to preserve hook order across renders.
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

  const loadListings = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = activeRequest.current + 1;
    activeRequest.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/featured-listings', { signal: controller.signal });
      if (!res.ok) throw new Error(DEFAULT_ERROR_MESSAGE);
      const data = (await res.json()) as FeaturedListingResponse;
      const rawListings = Array.isArray(data.listings)
        ? data.listings
        : Array.isArray(data.data?.listings)
          ? data.data?.listings
          : [];

      // Optimized data transformation to avoid repeated processing
      const normalized = (rawListings as unknown[])
        .map(toFeaturedListing)
        .filter((listing): listing is FeaturedListingDTO => listing !== null);

      if (controller.signal.aborted || activeRequest.current !== requestId) return;
      setListings(normalized);
      setError(null);
    } catch (err) {
      if (controller.signal.aborted || activeRequest.current !== requestId) return;

      const message =
        err instanceof Error && err.message && !/fetch failed/i.test(err.message)
          ? err.message
          : DEFAULT_ERROR_MESSAGE;
      setError(message);
    } finally {
      if (controller.signal.aborted || activeRequest.current !== requestId) return;
      setLoading(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void loadListings();
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [loadListings]);

  const handleRetry = useCallback(() => {
    void loadListings();
  }, [loadListings]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Memoized button handlers to reduce re-renders
  const handleMouseEnter = useCallback(() => autoplay.current?.stop(), []);
  const handleMouseLeave = useCallback(() => autoplay.current?.play(), []);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader
          title="Featured Sustainable Venues"
          description="Handpicked eco-friendly spaces that prioritize sustainability without compromising on quality"
        />

        {loading ? (
          <div className="text-center">
            <p className="body-lg">Loading featured listings...</p>
          </div>
        ) : error ? (
          <div className="text-center space-y-4">
            <p className="body-lg text-red-500" role="alert">
              {error}
            </p>
            <NeoButton variant="primary" onClick={handleRetry} disabled={loading}>
              Retry
            </NeoButton>
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}
