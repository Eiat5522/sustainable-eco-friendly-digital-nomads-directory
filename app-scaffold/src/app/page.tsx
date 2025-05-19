'use client';

import CitiesCarousel from '@/components/home/CitiesCarousel';
import FeaturedListings from '@/components/home/FeaturedListings';
import WhyChooseUs from '@/components/home/WhyChooseUs';

// Sample city data for testing
const sampleCities = [
  {
    id: '1',
    name: 'Chiang Mai',
    imageUrl: '/images/cities/chiangmai.jpg',
    description: 'Digital nomad hub with rich culture and affordable living',
    slug: 'chiang-mai',
    listingsCount: 45
  },
  {
    id: '2',
    name: 'Bali',
    imageUrl: '/images/cities/bali.jpg',
    description: 'Tropical paradise with vibrant coworking scene',
    slug: 'bali',
    listingsCount: 38
  },
  {
    id: '3',
    name: 'Lisbon',
    imageUrl: '/images/cities/lisbon.jpg',
    description: 'Historic city with modern digital infrastructure',
    slug: 'lisbon',
    listingsCount: 32
  },
  {
    id: '4',
    name: 'Mexico City',
    imageUrl: '/images/cities/mexico-city.jpg',
    description: 'Cultural metropolis with thriving startup ecosystem',
    slug: 'mexico-city',
    listingsCount: 29
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Sustainable Living for</span>
            <span className="block text-green-600">Digital Nomads</span>
          </h1>
          <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
            Discover eco-friendly accommodations, workspaces, and communities in the world's top digital nomad destinations.
          </p>
        </section>

        {/* Cities Carousel Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Eco-Friendly Destinations</h2>
          <CitiesCarousel cities={sampleCities} />
        </section>

        {/* Featured Listings Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Sustainable Spaces</h2>
          <FeaturedListings />
        </section>

        {/* Why Choose Us Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Our Platform</h2>
          <WhyChooseUs />
        </section>
      </div>
    </main>
  );
}
