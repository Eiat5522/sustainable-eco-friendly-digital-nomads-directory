'use client';

import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import type { CityDTO } from '@/types/dto';

type ApiResponse = { success?: boolean; cities?: CityDTO[] };

export function CityCarousel() {
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/cities', { signal: controller.signal });
        let json: ApiResponse | null = null;
        try {
          json = await res.json();
        } catch {}
        // Accept fallback responses even when status is 503
        const list = json && 'cities' in json && Array.isArray(json.cities) ? json.cities : [];
        if (!cancelled) {
          if (list.length > 0) {
            const sliced = list.slice(0, 8);
            setCities(sliced);
            setError(null);
          } else if (!res.ok) {
            setError('Error: failed to fetch cities');
          }
        }
      } catch (_err) {
        if (!cancelled) setError('Error: failed to fetch cities');
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
  }, []);

  const sanitizedCities = cities
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

  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="heading-lg">Featured Cities</h2>
            <p className="body-lg text-neo-text-secondary">
              Discover your next eco-friendly destination
            </p>
          </div>
        </div>

        {loading && (
          <p className="body-md text-neo-text-secondary" aria-live="polite">
            Loading cities…
          </p>
        )}

        {error && !loading && <p className="body-md text-red-600">{error}</p>}

        {!loading && !error && sanitizedCities.length > 0 && (
          <div className="relative">
            <NeoButton
              variant="secondary"
              size="sm"
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
              aria-label="Scroll cities left"
              onClick={scrollPrev}
              disabled={!canPrev}
              onMouseEnter={() => autoplay.current?.stop()}
              onMouseLeave={() => autoplay.current?.play()}
            >
              <ChevronLeft size={18} />
            </NeoButton>

            <div
              ref={viewportRef}
              className="overflow-hidden"
              role="region"
              aria-label="Featured city destinations"
            >
              <div className="flex gap-6" role="list">
                {sanitizedCities.map((city, index) => {
                  const key =
                    city._originalSlug || city._fallbackId || city.name || `city-${index}`;
                  const slugSegment = city.slug;
                  const displayName =
                    city.name && city.name.length > 0 ? city.name : 'Explore City';
                  return (
                    <div
                      key={key}
                      role="listitem"
                      className="flex-none w-[85%] sm:w-[55%] lg:w-1/3 xl:w-1/4"
                    >
                      <Link
                        href={`/cities/${encodeURIComponent(slugSegment)}`}
                        className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-label={`Explore ${displayName}`}
                      >
                        <div className="relative h-48 w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] group-focus-within:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-all">
                          {/* Always render local placeholder to avoid 404s and layout shifts */}
                          <Image
                            src="/placeholder_image.png"
                            alt=""
                            aria-hidden="true"
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover"
                            priority={false}
                          />
                          {/* If a city image exists, layer it above the placeholder; hide if it errors */}
                          {city.imageUrl ? (
                            <Image
                              src={city.imageUrl}
                              alt={city.name}
                              fill
                              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                // Hide broken remote image so local placeholder remains visible
                                e.currentTarget.hidden = true;
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 text-white">
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{displayName}</span>
                              {typeof city.sustainabilityScore === 'number' && (
                                <span className="text-xs bg-emerald-400 text-black px-2 py-0.5 rounded-full font-bold">
                                  {city.sustainabilityScore}%
                                </span>
                              )}
                            </div>
                            {city.country && <p className="text-xs opacity-90">{city.country}</p>}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <NeoButton
              variant="secondary"
              size="sm"
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
              aria-label="Scroll cities right"
              onClick={scrollNext}
              disabled={!canNext}
              onMouseEnter={() => autoplay.current?.stop()}
              onMouseLeave={() => autoplay.current?.play()}
            >
              <ChevronRight size={18} />
            </NeoButton>
          </div>
        )}
      </div>
    </section>
  );
}
