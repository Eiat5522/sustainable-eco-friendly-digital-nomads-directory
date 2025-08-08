'use client';

import dynamic from 'next/dynamic';

interface City {
  _id: string;
  title: string;
  description: string;
  slug: string;
  primaryImage: {
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
  const ecoCities = cities.map((city) => ({
    _id: city._id,
    name: city.title,
    image: city.primaryImage, // Pass the full SanityImage object instead of just the URL
    sustainabilityScore: city.sustainabilityScore,
    highlights: city.highlights,
  }));

  return (
    <section className="relative">
      <EcoCityCarousel cities={ecoCities} />
    </section>
  );
}
