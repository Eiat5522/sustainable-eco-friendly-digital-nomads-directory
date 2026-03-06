'use client';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import type { CityDTO } from '@/types/dto';

type ApiResponse = { success?: boolean; cities?: CityDTO[] };

type CityCarouselProps = {
  initialCities?: CityDTO[] | null;
};

const sanitizeCityData = (cities: CityDTO[]) => {
  return cities
    .map(city => {
      const safeSlug = typeof city.slug === 'string' ? city.slug.trim() : '';
      const safeId = typeof city.id === 'string' ? city.id.trim() : '';
      const safeName = typeof city.name === 'string' ? city.name.trim() : '';

      return {
        ...city,
        slug: safeSlug || safeId,
        name: safeName,
        _originalSlug: safeSlug,
        _fallbackId: safeId,
      };
    })
    .filter(city => city.slug && city.slug.length > 0);
};

const CityCard = memo(
  ({ city }: { city: CityDTO & { _originalSlug: string; _fallbackId: string } }) => {
    const slugSegment = city.slug;
    const displayName = city.name && city.name.length > 0 ? city.name : 'Explore City';

    return (
      <div role="listitem" className="flex-none w-[85%] sm:w-[55%] lg:w-1/3 xl:w-1/4">
        <Link
          href={`/cities/${encodeURIComponent(slugSegment)}`}
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
          aria-label={`Explore ${displayName}`}
        >
          <div
            className="relative h-52 overflow-hidden border-4 border-neo-border bg-neo-surface"
            style={{ boxShadow: '8px 8px 0px 0px var(--neo-shadow)' }}
          >
            <Image
              src="/placeholder_image.png"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            {city.imageUrl ? (
              <Image
                src={city.imageUrl}
                alt={city.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                  event.currentTarget.hidden = true;
                }}
              />
            ) : null}

            <div className="absolute inset-x-0 bottom-0 border-t-4 border-neo-border bg-neo-surface/95 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black uppercase tracking-[0.08em] text-neo-border">
                  {displayName}
                </span>
                {typeof city.sustainabilityScore === 'number' && (
                  <span className="border-2 border-neo-border bg-neo-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-neo-border">
                    {city.sustainabilityScore}%
                  </span>
                )}
              </div>
              {city.country && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-neo-text-secondary">
                  {city.country}
                </p>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }
);

CityCard.displayName = 'CityCard';

export function CityCarousel({ initialCities }: CityCarouselProps = {}): React.JSX.Element {
  const initialCitiesProvided = initialCities !== undefined && initialCities !== null;

  const [cities, setCities] = useState<CityDTO[]>(initialCities ?? []);
  const [loading, setLoading] = useState(!initialCitiesProvided);
  const [error, setError] = useState<string | null>(null);

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

  const sanitizedCities = useMemo(() => sanitizeCityData(cities), [cities]);

  useEffect(() => {
    if (initialCitiesProvided) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cities', { signal: controller.signal });

        let payload: ApiResponse | null = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        const list =
          payload && 'cities' in payload && Array.isArray(payload.cities) ? payload.cities : [];

        if (!cancelled) {
          if (list.length > 0) {
            setCities(list.slice(0, 8));
            setError(null);
          } else if (!response.ok) {
            setError('Error: failed to fetch cities');
          }
        }
      } catch {
        if (!cancelled) {
          setError('Error: failed to fetch cities');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [initialCitiesProvided]);

  const handleMouseEnter = useCallback(() => autoplay.current?.stop(), []);
  const handleMouseLeave = useCallback(() => autoplay.current?.play(), []);

  return (
    <section className="relative overflow-hidden bg-neo-surface px-4 py-12 sm:py-14">
      <div className="pointer-events-none absolute -left-6 top-12 h-20 w-20 rotate-12 border-4 border-neo-border bg-neo-accent shadow-[6px_6px_0_0] shadow-neo-shadow" />
      <div className="pointer-events-none absolute right-8 bottom-10 h-24 w-24 rounded-full border-4 border-neo-border bg-neo-secondary opacity-70" />

      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-block border-2 border-neo-border bg-neo-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[3px_3px_0_0] shadow-neo-shadow">
              Featured Cities
            </div>
            <h2 className="heading-lg text-neo-border">Find Your Next Base</h2>
            <p className="mt-1 text-sm font-semibold text-neo-text-secondary">
              Explore destinations selected for remote-work quality and sustainability.
            </p>
          </div>
        </div>

        {loading && (
          <p className="text-sm font-semibold text-neo-text-secondary" aria-live="polite">
            Loading cities...
          </p>
        )}

        {error && !loading && <p className="text-sm font-semibold text-red-600">{error}</p>}

        {!loading && !error && sanitizedCities.length > 0 && (
          <div className="relative">
            <NeoButton
              variant="outline"
              size="sm"
              className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 md:flex"
              aria-label="Scroll cities left"
              onClick={scrollPrev}
              disabled={!canPrev}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ChevronLeft size={18} />
            </NeoButton>

            <div
              ref={viewportRef}
              className="overflow-hidden"
              role="region"
              aria-label="Featured city destinations"
            >
              <div className="flex gap-5" role="list">
                {sanitizedCities.map((city, index) => (
                  <CityCard
                    key={city._originalSlug || city._fallbackId || city.name || `city-${index}`}
                    city={city}
                  />
                ))}
              </div>
            </div>

            <NeoButton
              variant="outline"
              size="sm"
              className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 md:flex"
              aria-label="Scroll cities right"
              onClick={scrollNext}
              disabled={!canNext}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <ChevronRight size={18} />
            </NeoButton>
          </div>
        )}
      </div>
    </section>
  );
}
