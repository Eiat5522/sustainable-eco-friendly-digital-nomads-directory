'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoBadge } from '@/components/ui/neo-badge';
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import type { CityDTO } from '@/types/dto';

export function CityCarousel() {
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Slider metrics (keep in sync with w-80 and gap-8)
  const CARD_WIDTH = 320;
  const GAP = 32;
  const STEP = CARD_WIDTH + GAP;

  useEffect(() => {
    const ac = new AbortController();
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities', { signal: ac.signal });
        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }
        const data = await response.json();
        const list = Array.isArray(data?.cities) ? data.cities : [];
        setCities(list);
        setError(null);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
    return () => ac.abort();
  }, []);

  // Clamp index if cities shrink or load with fewer items
  useEffect(() => {
    setCurrentIndex((idx) => Math.min(idx, Math.max(0, cities.length - 1)));
  }, [cities.length]);

  const router = useRouter();
  const handleExploreCity = (citySlug: string) => {
    router.push(`/city/${citySlug}`);
  };

  if (loading) {
    return (
      <section
        className="py-16 bg-gradient-to-r from-green-50 to-blue-50"
        aria-busy="true"
      >
        <div
          className="container mx-auto px-4 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="body-lg">Loading cities…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <p className="body-lg text-red-500" role="alert">
            Error: {error}
          </p>
        </div>
      </section>
    );
  }

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
          <div className="hidden md:flex space-x-2">
            <NeoButton
              variant="outline"
              size="sm"
              aria-label="Previous cities"
              aria-controls="city-carousel-track"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex <= 0 || cities.length === 0}
            >
              <ChevronLeft size={20} />
            </NeoButton>
            <NeoButton
              variant="outline"
              size="sm"
              aria-label="Next cities"
              aria-controls="city-carousel-track"
              onClick={() =>
                setCurrentIndex((i) =>
                  Math.min(i + 1, Math.max(0, cities.length - 1))
                )
              }
              disabled={
                cities.length === 0 ||
                currentIndex >= Math.max(0, cities.length - 1)
              }
            >
              <ChevronRight size={20} />
            </NeoButton>
          </div>
        </div>

        <div
          id="city-carousel-track"
          className="flex transition-transform duration-300 gap-8 overflow-hidden will-change-transform"
          role="list"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft')
              setCurrentIndex((i) => Math.max(0, i - 1));
            if (e.key === 'ArrowRight')
              setCurrentIndex((i) =>
                Math.min(i + 1, Math.max(0, cities.length - 1))
              );
          }}
          style={{ transform: `translateX(-${currentIndex * STEP}px)` }}
          aria-live="polite"
          aria-atomic="true"
        >
          {cities.map((city) => (
            <NeoCard
              key={city.id}
              role="listitem"
              className="w-80 flex-none group hover:shadow-[16px_16px_0px_0px] transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-56 -m-6 mb-4">
                {city.imageUrl ? (
                  <Image
                    src={city.imageUrl}
                    alt={`${city.name}, ${city.country}`}
                    fill
                    sizes="320px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-neo-text-secondary">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute top-4 left-4 flex space-x-2">
                  {city.sustainabilityScore && (
                    <NeoBadge
                      variant="success"
                      className="flex items-center space-x-1"
                    >
                      <Leaf size={12} />
                      <span>{city.sustainabilityScore}%</span>
                    </NeoBadge>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="heading-md text-white mb-1">{city.name}</h3>
                  <p className="body-sm text-white/80">{city.country}</p>
                </div>
              </div>

              <NeoCardContent className="px-6 pb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {city.highlights?.map((highlight, i) => (
                    <NeoBadge
                      key={`${city.id}-${i}`}
                      variant="outline"
                      size="sm"
                    >
                      {highlight}
                    </NeoBadge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <NeoButton
                    variant="primary"
                    size="sm"
                    aria-label={`Explore ${city.name}`}
                    onClick={() => handleExploreCity(city.slug)}
                  >
                    Explore City
                  </NeoButton>
                </div>
              </NeoCardContent>
            </NeoCard>
          ))}
        </div>
      </div>
    </section>
  );
}