import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Mock data - replace with actual API calls
const listings = [
  {
    id: 1,
    name: 'Bamboo Eco Villa',
    slug: 'bamboo-eco-villa',
    location: 'Ubud, Bali',
    image: '/images/listings/bamboo-villa.jpg',
    type: 'Accommodation',
    price: 65,
    currency: 'USD',
    eco_features: ['Solar Powered', 'Rainwater Harvesting', 'Bamboo Construction'],
    rating: 4.9,
    reviews: 128
  },
  {
    id: 2,
    name: 'Green Coworking Oasis',
    slug: 'green-coworking-oasis',
    location: 'Lisbon, Portugal',
    image: '/images/listings/green-coworking.jpg',
    type: 'Workspace',
    price: 15,
    currency: 'USD',
    eco_features: ['Energy Efficient', 'Living Walls', 'Zero Waste Policy'],
    rating: 4.8,
    reviews: 95
  },
  {
    id: 3,
    name: 'Sustainable Laptop-Friendly Café',
    slug: 'sustainable-cafe',
    location: 'Chiang Mai, Thailand',
    image: '/images/listings/eco-cafe.jpg',
    type: 'Café',
    price: 5,
    currency: 'USD',
    eco_features: ['Organic Food', 'Supports Local Farmers', 'Plastic Free'],
    rating: 4.7,
    reviews: 112
  },
  {
    id: 4,
    name: 'Earth-Friendly Coliving Space',
    slug: 'earth-friendly-coliving',
    location: 'Mexico City, Mexico',
    image: '/images/listings/eco-coliving.jpg',
    type: 'Coliving',
    price: 750,
    currency: 'USD',
    eco_features: ['Composting', 'Community Garden', 'Solar Hot Water'],
    rating: 4.6,
    reviews: 78
  }
];

const EcoFriendlyListings: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < (el.scrollWidth - el.clientWidth - 5));
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollability);
      // Initial check
      checkScrollability();

      return () => el.removeEventListener('scroll', checkScrollability);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75;
      const newPosition = direction === 'left'
        ? el.scrollLeft - scrollAmount
        : el.scrollLeft + scrollAmount;

      el.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-20 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              Top Eco-Friendly <span className="text-green-600 dark:text-green-400">Spaces</span>
            </motion.h2>
            <motion.p
              className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Stay, work, and connect with like-minded individuals at these sustainable venues that prioritize environmental responsibility.
            </motion.p>
          </div>

          <div className="hidden md:flex space-x-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-3 rounded-full border ${
                canScrollLeft
                  ? 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              } transition-colors`}
              aria-label="Scroll left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-3 rounded-full border ${
                canScrollRight
                  ? 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              } transition-colors`}
              aria-label="Scroll right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={ref}
          className="relative -mx-4"
        >
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto pb-8 px-4 -mx-4 scrollbar-hide snap-x snap-mandatory"
          >
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                className="flex-shrink-0 w-full md:w-[calc(50%-16px)] lg:w-[calc(33.333%-20px)] xl:w-[calc(25%-24px)] px-4 snap-start"
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={`/listing/${listing.slug}`} className="block h-full">
                  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="relative h-56">
                      <Image
                        src={listing.image}
                        alt={listing.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-green-500/90 text-white text-xs font-semibold px-2 py-1 rounded-md">
                        {listing.type}
                      </div>
                      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md rounded-lg px-3 py-1 text-sm font-semibold">
                        {listing.price === 0 ? 'Free' : `${listing.price} ${listing.currency}`}
                        {listing.type === 'Workspace' || listing.type === 'Café' ? '/day' : '/night'}
                      </div>
                    </div>
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{listing.name}</h3>
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-gray-300 ml-1">{listing.rating}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({listing.reviews})</span>
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.location}
                      </p>
                      <div className="mt-auto">
                        <div className="flex flex-wrap gap-2">
                          {listing.eco_features.slice(0, 2).map((feature, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 rounded">
                              {feature}
                            </span>
                          ))}
                          {listing.eco_features.length > 2 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              +{listing.eco_features.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Gradient fades for scroll indication */}
          <div className="absolute top-0 bottom-8 left-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
          <div className="absolute top-0 bottom-8 right-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/listings"
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            View All Listings
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EcoFriendlyListings;
