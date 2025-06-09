'use client';

import { getAllCities, getFeaturedListings } from '@/lib/sanity/queries';
import { useEffect, useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import FeaturedListings from '@/components/home/FeaturedListings';
import CitiesCarousel from '@/components/home/CitiesCarousel';
import { SanityListing } from '@/types/sanity';

interface City {
  _id: string;
  title: string;
  description: string;
  slug: string;
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
  country: string;
  sustainabilityScore: number;
  highlights: string[];
}

const HomePage = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [errorCities, setErrorCities] = useState<string | null>(null);

  const [featuredListings, setFeaturedListings] = useState<SanityListing[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await getAllCities();
        setCities(data);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setErrorCities('Failed to load cities. Please try again later.');
      } finally {
        setIsLoadingCities(false);
      }
    };

    const fetchFeaturedListings = async () => {
      try {
        const data = await getFeaturedListings();
        setFeaturedListings(data);
      } catch (err) {
        console.error('Failed to fetch featured listings:', err);
        setErrorFeatured('Failed to load featured listings. Please try again later.');
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchCities();
    fetchFeaturedListings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Listings Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Featured Sustainable Spaces
          </h2>
          {isLoadingFeatured ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-gray-500">Loading featured listings...</div>
            </div>
          ) : errorFeatured ? (
            <div className="text-center text-red-500 py-8">{errorFeatured}</div>
          ) : (
            <FeaturedListings listings={featuredListings} />
          )}
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          {isLoadingCities ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-pulse text-gray-500">Loading cities...</div>
            </div>
          ) : errorCities ? (
            <div className="text-center text-red-500 py-8">{errorCities}</div>
          ) : (
            <CitiesCarousel cities={cities} />
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;