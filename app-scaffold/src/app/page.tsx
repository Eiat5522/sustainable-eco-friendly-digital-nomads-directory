'use client';

import CitiesCarousel from '@/components/home/CitiesCarousel';
import FeaturedListings from '@/components/home/FeaturedListings';
import WhyChooseUs from '@/components/home/WhyChooseUs';
import { getAllCities } from '@/lib/sanity/queries';
import { useEffect, useState } from 'react';

interface SanityCity {
  _id: string;
  title: string;  // Changed from name to title to match Sanity schema
  slug: string;
  country: string;
  description: string;
  sustainabilityScore: number;
  highlights: string[];
  mainImage: string;
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
        setCities(fetchedCities || []);
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
          <CitiesCarousel cities={cities} />
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
