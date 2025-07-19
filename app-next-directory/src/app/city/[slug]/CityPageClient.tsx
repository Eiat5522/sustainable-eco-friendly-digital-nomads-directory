'use client';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ListingCard } from '@/components/listings/ListingCard';
import { Listing } from '@/types/listing';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface CityPageClientProps {
  city: any;
  listings: Listing[];
}

export default function CityPageClient({ city, listings }: CityPageClientProps) {
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Cities', href: '/cities' },
    { name: city.title },
  ];

  return (
    <>
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
              <Breadcrumbs segments={breadcrumbs} />
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
                {city.highlights.map((highlight: string, index: number) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">                {listings.map((listing: Listing, index) => (
                  <motion.div
                    key={listing.slug || listing._id || index}
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
