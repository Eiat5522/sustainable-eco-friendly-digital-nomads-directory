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
          <CityCarouselWave cities={cities} />
        )}
      </div>
    </section>
  );
}
