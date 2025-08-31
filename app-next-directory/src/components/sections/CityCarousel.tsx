"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CityDTO } from '@/types/dto';

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
        if (!res.ok) throw new Error('Failed');
        const json: ApiResponse = await res.json();
        const list = (json && 'cities' in json && Array.isArray(json.cities)) ? json.cities : [];
        if (!cancelled) setCities(list.slice(0, 8));
      } catch (e) {
        if (!cancelled) setError('Error: failed to fetch cities');
      } finally {
        if (!cancelled) setLoading(false);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
            {cities.map((city) => (
              <Link key={city.id} href={`/city/${city.slug}`} className="block group" aria-label={`View ${city.name} city page`}>
                <div className="relative h-48 w-full overflow-hidden rounded-xl border-4 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] transition-all">
                  {city.imageUrl ? (
                    <Image
                      src={city.imageUrl}
                      alt={city.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-sky-200" aria-hidden="true" />
                  )}
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
