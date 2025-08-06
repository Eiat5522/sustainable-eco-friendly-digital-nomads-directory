'use client';

import { HeroSection } from '@/components/HeroSection';
import FeaturedListings from '@/components/home/FeaturedListings';
import CitiesCarousel from '@/components/home/CitiesCarousel';
import { mockCities, mockFeaturedListings } from '@/lib/mockData';

export default function TestImagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Listings Section with Mock Data */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Featured Sustainable Spaces (Mock Data Demo)
          </h2>
          <FeaturedListings listings={mockFeaturedListings} />
        </div>
      </section>

      {/* Cities Section with Mock Data */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Explore Cities (Mock Data Demo)
          </h2>
          <CitiesCarousel cities={mockCities} />
        </div>
      </section>
    </div>
  );
}
