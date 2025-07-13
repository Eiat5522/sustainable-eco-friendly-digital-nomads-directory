'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Listing {
  _id: string;
  name: string;
  slug: { current: string };
  description_short: string;
  primary_image_url: string;
  category: string;
  city: {
    name: string;
    country: string;
  };
  eco_features: string[];
}

interface RelatedListingsProps {
  currentSlug: string;
  category: string;
  cityName: string;
}

export function RelatedListings({ currentSlug, category, cityName }: RelatedListingsProps) {
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedListings() {
      try {
        const response = await fetch(`/api/listings?category=${encodeURIComponent(category)}&limit=3`);
        if (response.ok) {
          const data = await response.json();
          // Filter out the current listing
          const filtered = data.listings?.filter((listing: Listing) => 
            listing.slug.current !== currentSlug
          ).slice(0, 3) || [];
          setRelatedListings(filtered);
        }
      } catch (error) {
        console.error('Error fetching related listings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedListings();
  }, [currentSlug, category, cityName]);

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Similar Eco-Friendly Spaces</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (relatedListings.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Similar Eco-Friendly Spaces</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedListings.map((listing) => (
          <Link
            key={listing._id}
            href={`/listings/${listing.slug.current}`}
            className="group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative h-48">
                <Image
                  src={listing.primary_image_url}
                  alt={listing.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {listing.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {listing.city.name}, {listing.category}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {listing.description_short}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}