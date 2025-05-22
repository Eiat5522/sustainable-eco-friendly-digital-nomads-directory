'use client';

import CitiesCarousel from '@/components/home/CitiesCarousel';
import FeaturedListings from '@/components/home/FeaturedListings';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import { getAllCities } from '@/lib/sanity/queries';
import { useEffect, useState } from 'react';

interface SanityCity {
  _id: string;
  title: string;
  slug: string;
  country: string;
  description: string;
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
  sustainabilityScore: number;
  highlights: string[];
}

export default function Home() {
  const [cities, setCities] = useState<SanityCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        setIsLoading(true);
        const fetchedCities = await getAllCities();
        console.log('Fetched cities in page.tsx:', JSON.stringify(fetchedCities, null, 2)); // Added console.log
        if (!fetchedCities || !Array.isArray(fetchedCities)) {
          throw new Error('Invalid city data received');
        }
        setCities(fetchedCities);
        setError(null);
      } catch (err) {
        console.error("Error fetching cities:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCities();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Sustainable Living for</span>
            <span className="block text-green-600">Digital Nomads</span>
          </h1>
          <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
            Discover eco-friendly accommodations, workspaces, and communities in the world's top digital nomad destinations.
          </p>
        </section>

        {/* Cities Carousel Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Eco-Friendly Destinations</h2>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-8">
              <p className="text-lg">Error loading cities: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <CitiesCarousel cities={cities} />
          )}
        </section>

        {/* Featured Listings Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Sustainable Spaces</h2>
          <FeaturedListings />
        </section>

        {/* Why Choose Us Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Our Platform</h2>
          <WhyChooseUs />
        </section>
      </div>
    </main>
  );
}
