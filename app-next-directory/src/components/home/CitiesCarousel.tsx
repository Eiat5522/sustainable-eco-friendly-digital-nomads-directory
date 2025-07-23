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

import EcoCityCarousel from '../cities/CityCarousel';

export default function CitiesCarousel({ cities }: CitiesCarouselProps) {
  return (
    <section className="relative">
      <EcoCityCarousel />
    </section>
  );
}
