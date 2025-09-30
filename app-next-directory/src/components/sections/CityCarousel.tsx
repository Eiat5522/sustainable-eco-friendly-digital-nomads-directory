"use client";

import React, { useEffect, useState } from 'react';
import type { CityDTO } from '@/types/dto';
import CityCarouselWave from '@/components/ui/city-carousel-wave';

type ApiResponse = { success?: boolean; cities?: CityDTO[] } | { cities?: CityDTO[] };

export function CityCarousel() {
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const list = (json && 'cities' in json && Array.isArray(json.cities)) ? json.cities : [];
        if (!cancelled) {
          if (list.length > 0) {
            setCities(list.slice(0, 8));
            setError(null);
          } else if (!res.ok) {
            setError('Error: failed to fetch cities');
          }
        }
      } catch (e) {
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

  return (
    <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="heading-lg">Featured Cities</h2>
            <p className="body-lg text-neo-text-secondary">Discover your next eco-friendly destination</p>
          </div>
        </div>

        {loading && (
          <p className="body-md text-neo-text-secondary" aria-live="polite">Loading cities…</p>
        )}

        {error && !loading && (
          <p className="body-md text-red-600">{error}</p>
        )}

        {!loading && !error && cities.length > 0 && (
          <div className="relative">
            <NeoButton
              variant="secondary"
              size="sm"
              className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
              aria-label="Scroll cities left"
              onClick={() => scrollBy(-1)}
              disabled={!canPrev}
            >
              <ChevronLeft size={18} />
            </NeoButton>

            <div
              ref={containerRef}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Featured city destinations"
            >
              {cities.map((city) => (
                <div
                  key={city.id}
                  role="listitem"
                  className="flex-none w-[85%] sm:w-[55%] lg:w-1/3 xl:w-1/4 snap-center sm:snap-start"
                >
                  <Link
                    href={`/cities/${city.slug}`}
                    className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                          <span className="font-bold">{city.name}</span>
                          {typeof city.sustainabilityScore === 'number' && (
                            <span className="text-xs bg-emerald-400 text-black px-2 py-0.5 rounded-full font-bold">
                              {city.sustainabilityScore}%
                            </span>
                          )}
                        </div>
                        {city.country && (
                          <p className="text-xs opacity-90">{city.country}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <NeoButton
              variant="secondary"
              size="sm"
              className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
              aria-label="Scroll cities right"
              onClick={() => scrollBy(1)}
              disabled={!canNext}
            >
              <ChevronRight size={18} />
            </NeoButton>
          </div>
        )}
      </div>
    </section>
  );
}
