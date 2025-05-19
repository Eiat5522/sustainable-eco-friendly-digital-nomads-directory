'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import AutoPlay from 'embla-carousel-autoplay';
import { twMerge } from 'tailwind-merge';

interface City {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  slug: string;
  listingsCount: number;
}

interface CityCarouselProps {
  cities: City[];
}

const bgColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-indigo-500',
  'bg-purple-500'
];

export default function CityCarousel({ cities }: CityCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
    },
    [
      AutoPlay({
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true
      })
    ]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Pause autoplay on component unmount
  useEffect(() => {
    return () => {
      if (emblaApi) emblaApi.plugins().autoplay?.stop();
    };
  }, [emblaApi]);

  return (
    <div className="relative max-w-[95vw] mx-auto">
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {cities.map((city, index) => (
            <div
              key={city.id}
              className="flex-[0_0_100%] min-w-0 pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
            >
              <Link href={`/city/${city.slug}`}>
                <div className="group relative overflow-hidden rounded-lg">
                  {/* Image Container with Fallback */}
                  <div className={`relative aspect-[4/3] ${bgColors[index % bgColors.length]}`}>
                    <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-medium">
                      {city.name}
                    </div>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* City Information */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-xl font-semibold mb-1">{city.name}</h3>
                    <p className="text-sm text-gray-200 line-clamp-2 mb-2">
                      {city.description}
                    </p>
                    <span className="inline-flex items-center text-sm bg-white/20 px-2.5 py-1 rounded-full">
                      {city.listingsCount} listings
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className={twMerge(
          "absolute left-4 top-1/2 -translate-y-1/2 z-10",
          "bg-white/90 hover:bg-white rounded-full p-2 shadow-lg",
          "transition-all duration-200 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        )}
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <button
        onClick={scrollNext}
        className={twMerge(
          "absolute right-4 top-1/2 -translate-y-1/2 z-10",
          "bg-white/90 hover:bg-white rounded-full p-2 shadow-lg",
          "transition-all duration-200 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        )}
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </div>
  );
}
