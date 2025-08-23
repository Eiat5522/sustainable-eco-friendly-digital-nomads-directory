'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ListingGrid } from '@/components/listings/ListingGrid';
import SearchBox from '@/components/search/SearchBox';
import FiltersSidebar from '@/components/search/FiltersSidebar';
import { AppListingCard } from '@/types/appView';

function mapToListingCard(result: any): AppListingCard {
  return {
    id: result._id,
    name: result.name,
    slug: result.slug?.current ?? result.slug,
    city: result.location ?? null,
    ecoFocusTags: result.ecoFeatures ?? [],
    digitalNomadFeatures: result.amenities ?? [],
    priceRange: result.priceRange,
    primaryImage: result.primaryImage,
    galleryImages: result.galleryImages,
    type: result.category,
    shortDescription: result.shortDescription,
    imageUrl: result.primaryImage?.asset?.url ?? null,
    category: result.category,
    location: result.location,
  };
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<AppListingCard[]>([]);

  const fetchResults = useCallback(
    async (params: URLSearchParams) => {
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      if (data?.success) {
        const mapped = (data.data.results || []).map(mapToListingCard);
        if (mapped.length === 1 && mapped[0].slug) {
          router.push(`/listings/${mapped[0].slug}`);
          return;
        }
        setListings(mapped);
      } else {
        setListings([]);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchResults(new URLSearchParams(searchParams.toString()));
  }, [searchParams, fetchResults]);

  const pushParams = (params: URLSearchParams) => {
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (filters: {
    searchText: string;
    destinations: string[];
    categories: string[];
    amenities: string[];
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('destination');
    params.delete('category');
    params.delete('amenities');
    if (filters.searchText) params.set('q', filters.searchText);
    filters.destinations.forEach((d) => params.append('destination', d));
    filters.categories.forEach((c) => params.append('category', c));
    filters.amenities.forEach((a) => params.append('amenities', a));
    params.set('page', '1');
    pushParams(params);
  };

  const handleFilterChange = (paramObj: {
    destination?: string[];
    category?: string[];
    nomadFeatures?: string[];
    amenities?: string[];
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('destination');
    params.delete('category');
    params.delete('nomadFeatures');
    params.delete('amenities');
    paramObj.destination?.forEach((d) => params.append('destination', d));
    paramObj.category?.forEach((c) => params.append('category', c));
    paramObj.nomadFeatures?.forEach((n) => params.append('nomadFeatures', n));
    paramObj.amenities?.forEach((a) => params.append('amenities', a));
    params.set('page', '1');
    pushParams(params);
  };

  return (
    <div className="p-4">
      <SearchBox initialValue={searchParams.get('q') || ''} onSearch={handleSearch} />
      <div className="mt-6 flex gap-6">
        <div className="w-64 flex-shrink-0">
          <FiltersSidebar onChange={handleFilterChange} />
        </div>
        <div className="flex-1">
          <ListingGrid listings={listings} />
        </div>
      </div>
    </div>
  );
}

