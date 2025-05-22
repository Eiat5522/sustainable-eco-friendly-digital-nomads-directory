'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ListingCard } from '@/components/listings/ListingCard';
import { PreviewBanner } from '@/components/preview/PreviewBanner';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { getClient } from '@/lib/sanity/client';
import { getCity, getListingsByCity } from '@/lib/sanity/queries';
import { Listing } from '@/types/listings';
import { motion } from 'framer-motion';
import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Utility to convert a string to a slug
function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

// Function to fetch all unique city names and convert them to slugs
async function getAllCitySlugs() {
  const client = getClient();
  // Fetch all unique city names from listings
  const cityNames = await client.fetch<string[]>(
    `array::unique(*[_type == "listing" && defined(city)].city)`
  );
  return cityNames.map((name: string) => ({ // Added type for name
    slug: slugify(name),
  }));
}

export async function generateStaticParams() {
  const citySlugs = await getAllCitySlugs();
  return citySlugs;
}

interface CityPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const client = getClient();
  // Fetch one listing for this city to get the actual city name for metadata
  // This assumes city names are consistent.
  const listingInCity = await client.fetch<Listing | null>(
    `*[_type == "listing" && defined(city)][0]{
      "id": _id,
      city
    }`
  ).then(result => result && slugify(result.city) === params.slug ? result : null);

  const cityName = listingInCity ? listingInCity.city : params.slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()); // Fallback to de-slugified slug

  if (!listingInCity && !cityName) { // If no listing found and slug is weird
    return { title: 'City Not Found' };
  }

  return {
    title: `${cityName} - Eco-Friendly Listings | Sustainable Digital Nomads`,
    description: `Discover sustainable coworking spaces, cafes, and accommodations in ${cityName}.`,
    openGraph: {
      title: `${cityName} - Sustainable Nomad Hotspots`,
      description: `Find the best eco-conscious places for digital nomads in ${cityName}.`,
    },
  };
}

export default function CityPage({ params }: CityPageProps) {
  const { isEnabled } = draftMode();
  const [city, setCity] = useState<any>(null); // Initialize with null or a default city structure
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const cityData = await getCity(params.slug);
        const listingsData = await getListingsByCity(params.slug);
        if (!cityData) {
          throw new Error('City not found');
        }
        setCity(cityData);
        setListings(listingsData || []);
        setError(null);
      } catch (err) {
        console.error(`Error fetching data for city ${params.slug}:`, err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setCity(null);
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error loading city data</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <Link href="/"
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  if (!city) {
    // This case should ideally be handled by a 404 page,
    // but for now, a simple message will do.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">City Not Found</h2>
        <p className="text-gray-600 mb-6">The city you are looking for does not exist or could not be loaded.</p>
        <Link href="/"
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    );
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Cities', href: '/cities' },
    { name: city.title },
  ];

  return (
    <>
      {isEnabled && <PreviewBanner />}
      <ScrollToTopButton />

      {/* Hero Section */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0">
          {city.mainImage?.asset?.url && (
            <Image
              src={city.mainImage.asset.url}
              alt={city.title}
              fill
              className="object-cover transform scale-105 motion-safe:animate-subtle-zoom"
              priority
            />
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-full flex flex-col justify-between py-12">
            {/* Breadcrumbs at top */}
            <div className="text-white/90">
              <Breadcrumbs segments={breadcrumbs} className="text-white/75" />
            </div>

            {/* City Information */}
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  {city.title}
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-6">
                  {city.description}
                </p>

                {/* Eco Score */}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/20 backdrop-blur-sm">
                  <span className="w-3 h-3 rounded-full bg-green-400 mr-2" />
                  <span className="text-green-400 font-medium">
                    Eco Score: {city.sustainabilityScore}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="animate-bounce bg-white/10 p-2 rounded-full backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      {city.highlights && city.highlights.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                City Highlights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {city.highlights.map((highlight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="text-gray-800">{highlight}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Listings Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Sustainable Places in {city.title}
            </h2>

            {listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {listings.map((listing: Listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <ListingCard listing={listing} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <p className="text-xl text-gray-700">
                  No listings found for {city.title} yet.
                </p>
                <p className="text-gray-500 mt-2">
                  Check back soon or explore other cities!
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}
