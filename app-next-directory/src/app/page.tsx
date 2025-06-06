'use client';

import { client } from '@/lib/sanity.utils';
import { useEffect, useState } from 'react';
import { HeroSection } from '@/components/HeroSection';
import FeaturedListings from '@/components/home/FeaturedListings';
import CitiesCarousel from '@/components/home/CitiesCarousel';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const query = `*[_type == "city"] {
          _id,
          title,
          description,
          "slug": slug.current,
          mainImage {
            asset-> {
              _id,
              url,
              metadata {
                dimensions {
                  width,
                  height
                }
              }
            }
          },
          country,
          sustainabilityScore,
          highlights
        }`;

        const data = await client.fetch<City[]>(query);
        console.log('Fetched cities data:', data);
        console.log('First city mainImage:', data[0]?.mainImage);
        setCities(data);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setError('Failed to load cities. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
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
          <FeaturedListings />
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-pulse text-gray-500">Loading cities...</div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <CitiesCarousel cities={cities} />
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
