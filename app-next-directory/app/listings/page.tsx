import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm';
import { getAllListings } from '@/lib/data/listings';
import type { SearchParamRecord } from '@/types/search';

interface SearchParams {
  search?: string;
  city?: string;
  type?: string;
  priceRange?: string;
  ecoTags?: string;
}

async function ListingsContent({ params }: { params: SearchParams }) {
  'use cache';
  cacheLife('hours');
  cacheTag('listings');

  const listings = await getAllListings({
    search: params.search,
    city: params.city,
    type: params.type,
    priceRange: params.priceRange,
    ecoTags: params.ecoTags?.split(','),
  });

  return <ListingGrid listings={listings} />;
}

async function MapSection({ params }: { params: SearchParams }) {
  'use cache';
  cacheLife('hours');
  cacheTag('listings-map');

  const listings = await getAllListings({
    search: params.search,
    city: params.city,
    type: params.type,
    priceRange: params.priceRange,
    ecoTags: params.ecoTags?.split(','),
  });

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border p-4">
      <p className="text-sm text-gray-600">
        Map placeholder — {Array.isArray(listings) ? listings.length : 0} listings.
      </p>
    </div>
  );
}

export default async function ListingsPage(props: { searchParams?: Promise<SearchParams> }) {
  // Await searchParams outside of cache scope
  const searchParams = await props.searchParams;
  const params = searchParams ?? ({} as SearchParams);

  const initialParams: SearchParamRecord = {
    q: params.search,
    destination: params.city,
    category: params.type,
    amenities: params.ecoTags?.split(','),
  };

  return (
    <PageLayoutServer>
      <div className="relative overflow-hidden bg-neo-secondary px-4 py-12 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, var(--neo-border) 2px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="container relative z-10 mx-auto max-w-6xl">
        <div
          className="overflow-hidden border-4 border-neo-border bg-neo-surface"
          style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
        >
          <div className="border-b-4 border-neo-border bg-neo-success p-6 md:p-8">
            <h1 className="heading-lg mb-2">Sustainable Venues Directory</h1>
            <p className="text-sm font-semibold text-neo-text-secondary">
              Discover eco-friendly workspaces, accommodations, and venues perfect for digital
              nomads.
            </p>
          </div>
          <div className="p-6 md:p-8">
            <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100" />}>
              <SearchFiltersForm initialParams={initialParams} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="container relative z-10 mx-auto mt-8 max-w-6xl">
        <div
          className="grid grid-cols-1 gap-8 border-4 border-neo-border bg-neo-surface p-6 lg:grid-cols-3 md:p-8"
          style={{ boxShadow: '12px 12px 0px 0px var(--neo-shadow)' }}
        >
          <div className="lg:col-span-2">
            <Suspense
              fallback={
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-32 animate-pulse bg-gray-100" />
                  ))}
                </div>
              }
            >
              <ListingsContent params={params} />
            </Suspense>
          </div>

          <div className="lg:col-span-1">
            <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
              <MapSection params={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
    </PageLayoutServer>
  );
}
