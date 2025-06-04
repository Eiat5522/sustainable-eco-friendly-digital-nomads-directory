'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Listing {
  _id: string;
  title: string;
  slug: string;
  images?: string[]; // Assuming image URLs are strings
  location: {
    city: string;
    country: string;
  };
  price: number;
  // Add any other relevant fields for a listing from your data structure
}

// Props for the component, if any are needed in the future
interface FeaturedListingsProps {}

export default function FeaturedListings({}: FeaturedListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedListings() {
      setLoading(true);
      setError(null);
      try {
        // Adjust the API endpoint and query parameters as per your backend
        const response = await fetch('/api/listings?featured=true&limit=4');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Assuming your API returns { success: boolean, listings: Listing[] }
        if (data.success && Array.isArray(data.listings)) {
          setListings(data.listings);
        } else {
          console.error(
            'API response was not successful or listings format is incorrect:',
            data
          );
          setError('Failed to load listings. Unexpected data format.');
        }
      } catch (err) {
        console.error('Error fetching featured listings:', err);
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedListings();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p>Loading featured listings...</p> {/* You can replace this with a spinner component */}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">
          Featured Listings
        </h2>
        {listings.length === 0 && !loading && (
          <p className="text-center text-gray-600">
            No featured listings available at the moment.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {listings.map((listing) => (
            <article
              key={listing._id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col"
            >
              <Link href={`/listing/${listing.slug}`} className="block group">
                {listing.images?.[0] ? (
                  <div className="w-full h-56 overflow-hidden">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </Link>
              <div className="p-5 flex flex-col flex-grow">
                {/* Increased padding and flex-grow */}
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="hover:text-green-600 transition-colors duration-200 line-clamp-2"
                    title={listing.title}
                  >
                    {listing.title}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {listing.location.city}, {listing.location.country}
                </p>
                <div className="mt-auto">
                  {/* Pushes price and button to the bottom */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-green-600">
                      ${listing.price}
                    </span>
                    <span className="text-xs text-gray-500">/night</span>
                  </div>
                  <Link
                    href={`/listing/${listing.slug}`}
                    className="block w-full text-center bg-green-500 text-white py-2.5 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {listings.length > 0 && (
          <div className="text-center mt-12">
            <Link
              href="/all-listings" // Assuming you have a page for all listings
              className="inline-block bg-transparent text-green-600 border-2 border-green-600 py-3 px-8 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300 ease-in-out text-sm font-semibold"
            >
              View All Listings
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
