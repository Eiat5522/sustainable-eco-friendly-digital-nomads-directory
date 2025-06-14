'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface City {
  _id: string;
  title: string;
  slug: string;
  country: string;
  description: string;
  sustainabilityScore: number;
  highlights: string[];
  mainImage: {
    alt?: string;
    asset: {
      url: string;
    };
  };
}

export default function CitiesSection() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        const response = await fetch('/api/cities');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch cities');
        setCities(data.cities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchCities();
  }, []);

  if (loading) {
    return <div className="py-12 text-center">Loading cities...</div>;
  }
  if (error) {
    return <div className="py-12 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <section className="py-12 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-green-900">Eco-Friendly Cities</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {cities.map(city => (
            <div key={city._id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
              <div className="relative w-full h-48">
                {city.mainImage?.asset?.url ? (
                  <Image
                    src={city.mainImage.asset.url}
                    alt={city.mainImage.alt || city.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold mb-1 text-green-800">{city.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{city.country}</p>
                <p className="text-gray-700 mb-3 line-clamp-3">{city.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {city.highlights?.filter(Boolean).map(tag => (
                    <span key={tag} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm text-gray-500">Sustainability Score:</span>
                  <span className="text-lg font-bold text-green-600">{city.sustainabilityScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
