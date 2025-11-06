'use client';

import React, { useState, useEffect } from 'react';
import { OptimizedImage, generateImageSizes } from './OptimizedImage';
import { motion } from 'framer-motion';

interface City {
  _id: string;
  name: string | null; // Allow null
  image: any; // Sanity image reference
  slug: string;
  listingCount: number | null; // Allow null
  ecoScore?: number | null; // Allow null
  sustainabilityFeatures?: string[] | null; // Allow null
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

  useEffect(() => {
    console.log("CityCarousel received cities prop:", JSON.stringify(cities, null, 2));
    if (cities && cities.length > 0) {
      cities.forEach((city, index) => {
        console.log(`City ${index} - Name: ${city.name}, Image: ${JSON.stringify(city.image)}, listingCount: ${city.listingCount}`);
      });
    } else {
      console.log("CityCarousel: cities prop is empty or undefined.");
    }
  }, [cities]);

  const nextSlide = () => {
    if (!cities || cities.length === 0) return;
    setCurrentIndex((prevIndex: number) => (prevIndex + 1) % cities.length);
  };

  const previousSlide = () => {
    if (!cities || cities.length === 0) return;
    setCurrentIndex((prevIndex: number) => (prevIndex - 1 + cities.length) % cities.length);
  };

  if (!cities || cities.length === 0) {
    return (
      <div className={`relative overflow-hidden py-8 ${className}`}>
        <div className="container mx-auto mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Sustainable Cities
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            No city data available at the moment. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`city-carousel-container relative overflow-hidden py-8 ${className}`}>
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">Sustainable Cities</h2>
      <p className="mb-6 text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        Explore eco-friendly destinations perfect for digital nomads
      </p>
      <div className="container mx-auto px-4">
        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={previousSlide}
            className="absolute top-1/2 left-4 z-10 -translate-y-1/2 transform rounded-full bg-white/50 p-2 text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Previous slide"
            disabled={cities.length <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-4 z-10 -translate-y-1/2 transform rounded-full bg-white/50 p-2 text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Next slide"
            disabled={cities.length <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Carousel track */}
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-all"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {cities.map((city, index) => {
                // Log individual city image data
                if (index === currentIndex) { // Log for the currently visible city
                  console.log(`CityCarousel: Image data for ${city.name || 'Unnamed City'} (current):`, JSON.stringify(city.image, null, 2));
                }
                return (
                  <motion.div
                    key={city._id || index} // Use index as fallback key if _id is missing
                    className="w-full flex-shrink-0 px-2 md:px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div
                      className="relative overflow-hidden rounded-lg shadow-md cursor-pointer max-w-2xl mx-auto"
                      onClick={() => city.slug && onCitySelect?.(city.slug)}
                      onHoverStart={() => setHoveredIndex(index)}
                      onHoverEnd={() => setHoveredIndex(null)}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* City image */}
                      <div className={"relative h-[250px] bg-gray-200 dark:bg-gray-700"}> {/* Added placeholder background */}
                        {city.image ? (
                          <OptimizedImage
                            image={city.image}
                            alt={city.name || 'City image'} // Use fallback for alt text
                            fill
                            className="object-cover"
                            sizes={imageSizes}
                            placeholder="eco" // Using eco placeholder
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            No image available
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      </div>

                      {/* Content overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <h3 className="text-xl font-semibold">{city.name || 'Unnamed City'}</h3>
                        <div className="flex items-center mt-2 text-sm">
                          <span className="opacity-90">{city.listingCount || 0} sustainable listings</span>
                          {city.ecoScore && (
                            <span className="ml-3 px-2 py-0.5 bg-green-500/80 rounded-full text-xs">
                              Eco Score: {city.ecoScore}
                            </span>
                          )}
                        </div>

                        {/* Sustainability features */}
                        {hoveredIndex === index && city.sustainabilityFeatures && city.sustainabilityFeatures.length > 0 && (
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
                );
              })}
            </motion.div>
          </div>

          {/* Pagination dots */}
          {cities.length > 1 && (
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 space-x-2">
              {cities.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    currentIndex === index ? 'bg-white' : 'bg-white/50'
                  } hover:bg-white focus:outline-none`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
