'use client';

import AutoPlay from 'embla-carousel-autoplay';
import useEmblaCarousel, { UseEmblaCarouselType } from 'embla-carousel-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface SanityImage {
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
}

interface City {
  _id: string;
  title: string;
  description: string;
  slug: string;
  mainImage: SanityImage;
  country: string;
  sustainabilityScore: number;
  highlights: string[];
}

interface CityCarouselProps {
  cities: City[];
}

const AUTO_PLAY_OPTIONS = {
  delay: 5000,
  stopOnInteraction: false,
  stopOnMouseEnter: true,
  playOnInit: true
} as const;

const CAROUSEL_OPTIONS = {
  loop: true,
  align: 'start',
  skipSnaps: false,
  breakpoints: {
    '(min-width: 640px)': { slidesToScroll: 2 },
    '(min-width: 1024px)': { slidesToScroll: 3 }
  }
} as const;

export default function CityCarousel({ cities }: CityCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(CAROUSEL_OPTIONS, [
    AutoPlay(AUTO_PLAY_OPTIONS)
  ]);

  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);
  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative py-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[95vw] mx-auto">
        {/* Carousel Container */}
        <div className="overflow-hidden rounded-xl" ref={emblaRef}>
          <div className="flex -ml-4">
            {cities.map((city, index) => (
              <div
                key={city._id}
                className="flex-[0_0_100%] min-w-0 pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <Link href={`/city/${city.slug}`}>
                  <div className="group relative overflow-hidden rounded-lg">
                    {/* Image Container */}
                    <div className="relative aspect-[4/3]" style={{ position: 'relative', height: '300px' }}>
                      {city.mainImage?.asset?.url ? (
                        <Image
                          src={city.mainImage.asset.url}
                          alt={city.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33.333vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          loading={index <= 2 ? "eager" : "lazy"}
                        />
                      ) : (
                        <div className="h-full bg-gray-200 flex items-center justify-center text-gray-500">
                          No image available
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
            "bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg",
            "transition-all duration-200 hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          onClick={scrollNext}
          disabled={nextBtnDisabled}
          className={twMerge(
            "absolute right-4 top-1/2 -translate-y-1/2 z-10",
            "bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg",
            "transition-all duration-200 hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-2 mt-4">
          {cities.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                activeIndex === index
                  ? 'w-4 bg-green-500'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
