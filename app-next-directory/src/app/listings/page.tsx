'use client';

import FeaturedListings from '@/components/listings/FeaturedListings';

export default function ListingsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Sustainable Listings
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Explore eco-friendly spaces for digital nomads
        </p>
      </section>

      {/* Listings Grid */}
      <section className="mb-16">
        <FeaturedListings />
      </section>
    </main>
  );
}
