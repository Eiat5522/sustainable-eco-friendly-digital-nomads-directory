import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Mock data - replace with actual data from your API/CMS
const destinations = [
  {
    id: 1,
    name: 'Bali, Indonesia',
    slug: 'bali-indonesia',
    image: '/images/destinations/bali.jpg',
    rating: 4.8,
    ecoScore: 85,
    count: 42
  },
  {
    id: 2,
    name: 'Lisbon, Portugal',
    slug: 'lisbon-portugal',
    image: '/images/destinations/lisbon.jpg',
    rating: 4.7,
    ecoScore: 88,
    count: 37
  },
  {
    id: 3,
    name: 'Chiang Mai, Thailand',
    slug: 'chiang-mai-thailand',
    image: '/images/destinations/chiang-mai.jpg',
    rating: 4.9,
    ecoScore: 82,
    count: 31
  },
  {
    id: 4,
    name: 'Mexico City, Mexico',
    slug: 'mexico-city-mexico',
    image: '/images/destinations/mexico-city.jpg',
    rating: 4.6,
    ecoScore: 79,
    count: 28
  }
];

const FeaturedDestinations: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] }
    }
  };

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Featured <span className="text-green-600 dark:text-green-400">Eco-Friendly</span> Destinations
          </motion.h2>
          <motion.p
            className="text-gray-600 dark:text-gray-300 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Discover sustainable cities that welcome digital nomads with eco-conscious accommodations and workspaces.
          </motion.p>
        </div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {destinations.map((destination) => (
            <motion.div
              key={destination.id}
              variants={itemVariants}
              onMouseEnter={() => setHoveredId(destination.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group"
            >
              <Link href={`/city/${destination.slug}`} className="block h-full">
                <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={`object-cover transform transition-transform duration-700 ${
                        hoveredId === destination.id ? 'scale-110' : 'scale-100'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-full px-3 py-1 flex items-center shadow-md">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs font-medium">Eco Score: {destination.ecoScore}%</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-xl font-semibold mb-1">
                        {destination.name}
                      </h3>
                      <div className="flex items-center">
                        <div className="flex text-yellow-400 mr-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill={i < Math.floor(destination.rating) ? 'currentColor' : 'none'}>
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-white text-sm">{destination.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 dark:text-gray-300">{destination.count} Listings</div>
                      <div className="text-green-600 dark:text-green-400 text-sm font-medium group-hover:underline transition-all duration-300">
                        Explore
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <Link
            href="/cities"
            className="inline-flex items-center px-6 py-3 border border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
          >
            View All Destinations
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;
