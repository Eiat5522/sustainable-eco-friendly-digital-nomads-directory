'use client';

import { useState, useRef, useEffect } from 'react';
import { OptimizedImage, generateImageSizes } from './OptimizedImage';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

interface City {
  _id: string;
  name: string;
  image: any; // Sanity image reference
  slug: string;
  listingCount: number;
  ecoScore?: number;
  sustainabilityFeatures?: string[];
}

interface CityCarouselProps {
  cities: City[];
  onCitySelect?: (citySlug: string) => void;
  className?: string;
}

const imageSizes = generateImageSizes({
  320: 100,
  768: 50,
  1024: 33.3
});

export function CityCarousel({ cities, onCitySelect, className = '' }: CityCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cities.length);
  };

  const previousSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + cities.length) % cities.length);
  };

  return (
    <div className={`relative overflow-hidden py-8 ${className}`}>
      {/* Section title */}
      <div className="container mx-auto mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Sustainable Cities
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Explore eco-friendly destinations perfect for digital nomads
        </p>
      </div>

      {/* Main carousel */}
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={previousSlide}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-lg text-primary-700"
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-lg text-primary-700"
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carousel track */}
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-all"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {cities.map((city, index) => (
                <motion.div
                  key={city._id}
                  className="w-full flex-shrink-0 px-2 md:px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    className="relative overflow-hidden rounded-lg shadow-md cursor-pointer max-w-2xl mx-auto"
                    onClick={() => onCitySelect?.(city.slug)}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* City image */}
                    <div className="relative h-[250px]">
                      <OptimizedImage
                        image={city.image}
                        alt={city.name}
                        fill
                        className="object-cover"
                        sizes={imageSizes}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                    </div>

                    {/* Content overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <h3 className="text-xl font-semibold">{city.name}</h3>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="opacity-90">{city.listingCount || 0} sustainable listings</span>
                        {city.ecoScore && (
                          <span className="ml-3 px-2 py-0.5 bg-green-500/80 rounded-full text-xs">
                            Eco Score: {city.ecoScore}
                          </span>
                        )}
                      </div>

                      {/* Sustainability features */}
                      {hoveredIndex === index && city.sustainabilityFeatures && (
                        <motion.div
                          className="mt-2 flex flex-wrap gap-1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {city.sustainabilityFeatures.slice(0, 2).map((feature, i) => (
                            <span
                              key={i}
                              className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {cities.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentIndex === index ? 'w-4 bg-primary-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}