'use client';

import dynamic from 'next/dynamic';

interface City {
  _id: string;
  title: string;
  description: string;
  slug: string;
  mainImage: {
    asset: {
      _id: string;
      url: string;
      metadata: {
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
  };
  country: string;
  sustainabilityScore: number;
  highlights: string[];
}

interface CitiesCarouselProps {
  cities: City[];
}

// Dynamically import CityCarousel to avoid hydration issues
const DynamicCityCarousel = dynamic(() => import('@/components/listings/CityCarousel'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[2/1] lg:aspect-[3/1] bg-gray-200 animate-pulse rounded-lg" />
  ),
});

export default function CitiesCarousel({ cities }: CitiesCarouselProps) {
  return (
    <section className="relative">
      <DynamicCityCarousel cities={cities} />
    </section>
  );
}
