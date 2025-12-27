'use cache';

import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm';
import { getAllListings } from '@/lib/data/listings';
import type { SearchParamRecord } from '@/types/search';

cacheLife('hours');
cacheTag('listings');

interface SearchParams {
  search?: string;
  city?: string;
  type?: string;
  priceRange?: string;
  ecoTags?: string;
}

async function ListingsContent({ searchParams }: { searchParams: SearchParams }) {
  // Use cache() to deduplicate requests within the same render pass
  const cachedGetListings = async (filters: SearchParams) => {
    cacheLife('hours');
    cacheTag('listings');

    return await getAllListings({
      search: filters.search,
      city: filters.city,
      type: filters.type,
      priceRange: filters.priceRange,
      ecoTags: filters.ecoTags?.split(','),
    });
  };

  const listings = await cachedGetListings(searchParams);

  return <ListingGrid listings={listings} />;
}

async function MapSection({ searchParams }: { searchParams: SearchParams }) {
  const listings = await getAllListings({
    search: searchParams.search,
    city: searchParams.city,
    type: searchParams.type,
    priceRange: searchParams.priceRange,
    ecoTags: searchParams.ecoTags?.split(','),
  });

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border p-4">
      <p className="text-sm text-gray-600">
        Map placeholder — {Array.isArray(listings) ? listings.length : 0} listings.
      </p>
    </div>
  );
}

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const initialParams: SearchParamRecord = {
    q: searchParams.search,
    destination: searchParams.city,
    category: searchParams.type,
    amenities: searchParams.ecoTags?.split(','),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Sustainable Venues Directory</h1>
        <p className="text-gray-600 mb-6">
          Discover eco-friendly workspaces, accommodations, and venues perfect for digital nomads
        </p>

        {/* PPR: Static content renders immediately, interactive elements stream in */}
        <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" />}>
          <SearchFiltersForm initialParams={initialParams} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main listings content - Server Component */}
        <div className="lg:col-span-2">
          <Suspense
            fallback={
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            }
          >
            <ListingsContent searchParams={searchParams} />
          </Suspense>
        </div>

        {/* Interactive map - Client Component in Suspense */}
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="h-96 bg-gray-100 rounded animate-pulse" />}>
            <MapSection searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
