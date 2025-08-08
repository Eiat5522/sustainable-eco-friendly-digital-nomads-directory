import FeaturedListings from '@/components/listings/FeaturedListings';
import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Listing } from '@/types/listings';
import { type Listing as SanityListing } from '@/../sanity.types';
import { AppListingCard } from '@/types/appView';
import { mapSanityListingToCard } from '@/lib/listings';

interface ListingsPageProps {
  initialListings: Array<Listing | SanityListing>;
}

export default function ListingsPage({ initialListings }: ListingsPageProps) {
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
        'activities': 'Activities'
      };

      const searchTerm = categoryMap[category] || category;
      router.replace(`/search?q=${encodeURIComponent(searchTerm)}`);
      return;
    }
  }, [searchParams, router]);

  const featuredListings: AppListingCard[] = useMemo(() => {
    return initialListings.map(l => {
      try {
        return mapSanityListingToCard(l);
      } catch (e) {
        console.warn('[WARN] Failed to map listing on listings page', (l as any)?._id || (l as any)?.id, e);
        return null as any;
      }
    }).filter(Boolean);
  }, [initialListings]);

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
        <FeaturedListings listings={featuredListings} />
      </section>
    </main>
  );
}