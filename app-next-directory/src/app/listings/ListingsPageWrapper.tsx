'use client';

import { useEffect, useState } from 'react';
import { type Listing } from '@/types/listings';
import { type SanityListing } from '@/types/sanity';
import ListingsPage from './ListingsPage';

export default function ListingsPageWrapper() {
  const [listings, setListings] = useState<Array<Listing | SanityListing>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch('/api/listings?featured=true');
        const data = await response.json();
        if (data.status === 'success') {
          setListings(data.data);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  return <ListingsPage initialListings={listings} />;
}
