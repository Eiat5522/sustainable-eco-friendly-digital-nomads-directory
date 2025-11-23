'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

interface Listing {
  _id: string;
  name: string;
  slug: string;
  description_short: string;
  primary_image_url: string;
  category: string;
  city: {
    name: string;
    country: string;
  };
  eco_features: string[];
  sustainability_score: number;
}

interface RelatedListingsProps {
  currentListing: Listing;
  allListings: Listing[];
  maxListings?: number;
  className?: string;
}

export function RelatedListings({
  currentListing,
  allListings,
  maxListings = 3,
  className = ''
}: RelatedListingsProps) {
  const relatedListings = useMemo(() => {
    // Filter out current listing
    const otherListings = allListings.filter(
      listing => listing._id !== currentListing._id
    );

    // Calculate relevance scores using multiple factors
    const scoredListings = otherListings.map(listing => {
      let score = 0;

      // Same category
      if (listing.category === currentListing.category) score += 3;

      // Same city
      if (listing.city.name === currentListing.city.name) score += 2;

      // Similar sustainability score (within 2 points)
      if (Math.abs(listing.sustainability_score - currentListing.sustainability_score) <= 2) {
        score += 1;
      }

      // Shared eco features
      const sharedFeatures = listing.eco_features.filter(feature =>
        currentListing.eco_features.includes(feature)
      );
      score += sharedFeatures.length * 0.5;

      return { listing, score };
    });

    // Sort by score and take top N
    return scoredListings
      .sort((a, b) => b.score - a.score)
      .slice(0, maxListings)
      .map(item => item.listing);
  }, [currentListing, allListings, maxListings]);

  if (relatedListings.length === 0) return null;

  return (
    <section className={`mt-12 ${className}`}>
      <h2 className="text-2xl font-bold mb-6">Similar Eco-Friendly Spaces</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedListings.map((listing, index) => (
          <motion.div
            key={listing._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              href={`/listings/${listing.slug}`}
              className="group block h-full"
            >
              <div className="h-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative h-48">
                  <Image
                    src={listing.primary_image_url}
                    alt={listing.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {listing.name}
                    </h3>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {listing.sustainability_score}/10
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {listing.city.name}, {listing.city.country}
                  </p>

                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                    {listing.description_short}
                  </p>

                  {/* Eco Features Tags */}
                  <div className="flex flex-wrap gap-1">
                    {listing.eco_features.slice(0, 2).map(feature => (
                      <span
                        key={feature}
                        className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                    {listing.eco_features.length > 2 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        +{listing.eco_features.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
