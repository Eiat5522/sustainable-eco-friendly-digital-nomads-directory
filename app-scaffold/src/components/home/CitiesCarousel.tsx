'use client';

import dynamic from 'next/dynamic';

interface City {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  slug: string;
  listingsCount: number;
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
