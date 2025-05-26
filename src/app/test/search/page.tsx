'use client';

import React, { useEffect, useState } from 'react';
import { SearchInput } from '@/components/search/SearchInput';
import { ListingCard } from '@/components/listings/ListingCard';
import type { Listing } from '@/types/listings';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    // Fetch listings when component mounts
    fetch('/api/test-listings')
      .then(res => res.json())
      .then(data => setListings(data))
      .catch(err => console.error('Failed to fetch listings:', err));
  }, []);

  const filteredListings = listings.filter(listing => {
    const searchLower = searchQuery.toLowerCase();
    return (
      listing.name.toLowerCase().includes(searchLower) ||
      listing.description_short.toLowerCase().includes(searchLower) ||
      listing.eco_focus_tags.some(tag => 
        tag.toLowerCase().includes(searchLower)
      ) ||
      listing.digital_nomad_features.some(feature =>
        feature.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search listings..."
          data-testid="search-input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map(listing => (
          <div key={listing.id} data-testid="listing-card">
            <ListingCard
              listing={listing}
              searchQuery={searchQuery}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
