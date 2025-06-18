'use client';

import FeaturedListings from '@/components/listings/FeaturedListings';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const category = searchParams?.get('category');
    if (category) {
      // Redirect old category URLs to search page
      const categoryMap: { [key: string]: string } = {
        'coworking': 'Coworking',
        'cafes': 'Cafe',
        'restaurants': 'Restaurant', 
        'accommodation': 'Accommodation',
        'retail': 'Retail',
        'offices': 'Office',
        'fashion': 'Fashion',
        'community': 'Community',
        'events': 'Events'
      };
      
      const searchTerm = categoryMap[category] || category;
      router.replace(`/search?q=${encodeURIComponent(searchTerm)}`);
      return;
    }
  }, [searchParams, router]);

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
      </section>      {/* Listings Grid */}
      <section className="mb-16">
        <FeaturedListings listings={[]} />
      </section>
    </main>
  );
}
