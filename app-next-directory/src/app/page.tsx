'use client'; // Required for useState and useEffect

import { client } from '@/lib/sanity.utils'; // Assuming this path is correct
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './HomePage.module.css';
import FeaturedListings from '@/components/listings/FeaturedListings'; // Updated import path

// Define an interface for the City data
interface City {
  _id: string;
  name: string;
  description: string;
  country: string;
  score: number;
  ecoHighlight: string;
  mainImage: {
    asset: {
      url: string;
    };
    alt: string;
  };
}

const HomePage = () => {
  const [citiesData, setCitiesData] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const query = `*[_type == "city"] {
          _id,
          name,
          description,
          country,
          score,
          ecoHighlight,
          mainImage {
            asset-> {
              url
            },
            alt
          }
        }[0...3]`; // Fetching up to 3 featured cities

        const data = await client.fetch<City[]>(query);
        setCitiesData(data);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setError('Failed to load featured cities. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, []);

  return (
    // Removed p-4 from here to allow hero to be full width if needed
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-800 text-white py-20 md:py-32 text-center">
        {/* Placeholder Background Image (to be replaced with Sanity CMS image) */}
        <div className={`absolute inset-0 z-0 ${styles.heroBg}`}></div>
        {/* Overlay to darken the background image for better text readability */}
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        {/* Content */}
        <div className="relative z-20 container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Travel Sustainably. Work Remotely.
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Find eco-friendly destinations and resources for the conscious digital nomad.
          </p>          <div className="mt-8 text-center">
            <Link
              href="/listings"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105 inline-block"
            >
              Explore Destinations
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Listings Section - ADDED HERE */}
      <FeaturedListings />

      {/* City Carousel Section */}
      <div className="mt-8 p-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Featured Cities</h2>
        {isLoading && (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-pulse text-gray-500">Loading cities...</div>
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 min-h-[200px] flex items-center justify-center">
            {error}
          </div>
        )}
        {!isLoading && !error && citiesData.length === 0 && (
          <div className="text-center text-gray-500 min-h-[200px] flex items-center justify-center">
            No featured cities available at the moment.
          </div>
        )}
        {!isLoading && !error && citiesData.length > 0 && (
          <div className="flex space-x-6 overflow-x-auto p-4 justify-center">
            {citiesData.map(city => (
              <div
                key={city._id}
                className="flex-shrink-0 w-72 h-96 rounded-lg overflow-hidden shadow-xl group relative"
              >
                <img
                  src={city.mainImage?.asset?.url || '/placeholder-city.jpg'}
                  alt={city.mainImage?.alt || `Image of ${city.name}`}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white text-xl font-semibold">{city.name}</h3>
                    <span className="text-green-400 font-semibold">{city.score}/10</span>
                  </div>
                  <p className="text-gray-200 text-sm mb-2">{city.country}</p>
                  <p className="text-green-300 text-sm font-medium mb-2">
                    {city.ecoHighlight}
                  </p>
                  <p className="text-gray-200 text-sm line-clamp-2">
                    {city.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
