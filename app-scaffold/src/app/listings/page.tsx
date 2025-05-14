'use client';

import { useEffect, useState } from 'react';
import { LatLngBounds } from 'leaflet';
import dynamic from 'next/dynamic';
import { type Listing } from '@/types/listings';
import FilterSidebar from '@/components/listings/FilterSidebar';

// Dynamically import map component to avoid SSR issues
const MapContainer = dynamic(
  () => import('@/components/map/MapContainer'),
  { ssr: false }
);

interface Filters {
  category?: string[];
  ecoTags?: string[];
  minPrice?: number;
  maxPrice?: number;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/legacy-listings');
        const data = await response.json();
        
        if (data.status === 'success') {
          setListings(data.data);
          setFilteredListings(data.data);
        } else {
          throw new Error(data.message || 'Failed to load listings');
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Apply filters and map bounds
  useEffect(() => {
    if (!listings.length) return;

    let filtered = [...listings];    // Apply category filter
    if (filters.category?.length) {
      filtered = filtered.filter(listing => 
        filters.category?.includes(listing.category) ?? false
      );
    }

    // Apply eco tags filter
    if (filters.ecoTags?.length) {
      filtered = filtered.filter(listing =>
        listing.eco_focus_tags.some(tag => filters.ecoTags?.includes(tag))
      );
    }

    // Apply price filter (if accommodation)
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filtered = filtered.filter(listing => {
        if (!listing.accommodation_details) return true;
        const { min, max } = listing.accommodation_details.price_per_night_thb_range;
        return (
          (filters.minPrice === undefined || min >= filters.minPrice) &&
          (filters.maxPrice === undefined || max <= filters.maxPrice)
        );
      });
    }

    // Apply map bounds filter
    if (mapBounds) {
      filtered = filtered.filter(listing => {
        const { latitude, longitude } = listing.coordinates;
        if (!latitude || !longitude) return false;
        return mapBounds.contains([latitude, longitude]);
      });
    }

    setFilteredListings(filtered);
  }, [listings, filters, mapBounds]);

  const handleBoundsChange = (bounds: LatLngBounds) => {
    setMapBounds(bounds);
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <FilterSidebar 
        filters={filters}
        onFilterChange={handleFilterChange}
        totalListings={listings.length}
        filteredCount={filteredListings.length}
      />
      <div className="flex-1 relative">
        <MapContainer
          listings={filteredListings}
          onBoundsChange={handleBoundsChange}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
