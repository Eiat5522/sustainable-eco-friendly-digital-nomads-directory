"use client";

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { City } from './CityCarousel';
import { cn } from '@/lib/utils';

// Dynamically import CityCarousel to avoid hydration mismatch
const DynamicCityCarousel = dynamic(() => import('./CityCarousel'), {
  ssr: false,
});

interface CitySectionProps {
  city: City;
  listingStats?: {
    coworking: number;
    cafe: number;
    accommodation: number;
    restaurant: number;
    activity: number;
  };
  className?: string;
}

export function CitySection({ city, listingStats, className }: CitySectionProps) {
  const statsRef = useRef<HTMLDivElement>(null);

  // Optional: Add scroll animation to stats when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  return (
    <section className={cn("py-16", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Image and Description */}
          <div>
            <div className="relative aspect-4/3 rounded-lg overflow-hidden mb-6">
              <Image
                src={city.imageUrl}
                alt={city.name}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold mb-4">{city.name}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {city.description}
            </p>
            <Link
              href={`/listings?city=${city.slug}`}
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Explore {city.name}
            </Link>
          </div>

          {/* Right Column: Stats */}
          {listingStats && (
            <div
              ref={statsRef}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
            >
              <h3 className="text-2xl font-semibold mb-6">Eco-Friendly Spaces</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(listingStats).map(([category, count]) => (
                  <div key={category} className="flex flex-col">
                    <dt className="text-gray-500 dark:text-gray-400 text-sm uppercase">
                      {category.charAt(0).toUpperCase() + category.slice(1)}s
                    </dt>
                    <dd className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      {count}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                  Sustainability Score
                </h4>
                <div className="flex items-center gap-2">
                  <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: '85%'
                      }}
                    />
                  </div>
                  <span className="text-green-800 dark:text-green-300 font-semibold">
                    85%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
}

export default CitySection;
