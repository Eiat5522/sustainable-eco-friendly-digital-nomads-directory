import FeaturedListings from '@/components/listings/FeaturedListings';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type Listing } from '@/types/listings';
import { type SanityListing } from '@/types/sanity';
import { AppListingCard } from '@/types/appView';

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

  const featuredListings: AppListingCard[] = initialListings.map(listing => ({
    id: (listing as any)._id || (listing as any).id,
    name: listing.name,
    slug: (listing as any).slug?.current || (listing as any).slug,
    city: (listing as any).city ? {
      id: (listing as any).city._id,
      name: (listing as any).city.name,
      slug: (listing as any).city.slug?.current || (listing as any).city.slug,
      country: (listing as any).city.country,
    } : null,
    ecoTags: (listing as any).ecoTags || [],
    priceRange: (listing as any).priceRange,
    website: (listing as any).website,
    category: (listing as any).category || (listing as any).type,
  }));

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