'use client';

import AutoPlay from 'embla-carousel-autoplay';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface City {
  _id: string;
  title: string;  // Changed from name to title to match Sanity schema
  description: string;
  slug: string;
  mainImage: string;
  country: string;
  sustainabilityScore: number;
  highlights: string[];
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
        stopOnMouseEnter: true,
        playOnInit: true
      })
    ]
  );

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: UseEmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on('select', () => onSelect(emblaApi));
    emblaApi.on('reInit', () => onSelect(emblaApi));

    return () => {
      emblaApi.off('select', () => onSelect(emblaApi));
      emblaApi.off('reInit', () => onSelect(emblaApi));
      emblaApi.destroy();
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative max-w-[95vw] mx-auto">
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {cities.map((city, index) => (
            <div
              key={city._id}
              className="flex-[0_0_100%] min-w-0 pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
            >
              <Link href={`/city/${city.slug}`}>
                <div className="group relative overflow-hidden rounded-lg">
                  {/* Image Container */}
                  <div className="relative aspect-[4/3]">
                    {city.mainImage ? (                      <Image
                        src={city.mainImage}
                        alt={city.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33.333vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`${bgColors[index % bgColors.length]} h-full flex items-center justify-center text-white text-lg font-medium`}>
                        {city.title}
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* City Information */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-xl font-semibold mb-1">{city.title}</h3>
                    <p className="text-sm text-gray-200 line-clamp-2 mb-2">
                      {city.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-green-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                        <span>Eco Score: {city.sustainabilityScore}</span>
                      </div>
                    </div>
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
        disabled={prevBtnDisabled}
        className={twMerge(
          "absolute left-4 top-1/2 -translate-y-1/2 z-10",
          "bg-white/90 hover:bg-white rounded-full p-2 shadow-lg",
          "transition-all duration-200 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed"
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
        disabled={nextBtnDisabled}
        className={twMerge(
          "absolute right-4 top-1/2 -translate-y-1/2 z-10",
          "bg-white/90 hover:bg-white rounded-full p-2 shadow-lg",
          "transition-all duration-200 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed"
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
