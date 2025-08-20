import React from 'react';
import FeaturedListings from '@/components/listings/FeaturedListings';
import type { FeaturedListingDTO } from '@/types/dto';

// Temporary mocked data to verify UI & styles; replace with real data fetching later.
const mockListings: FeaturedListingDTO[] = [
  { id: '1', name: 'Green CoWork', slug: 'green-cowork', imageUrl: '/images/fallback.png', city: 'Chiang Mai', amenityNames: ['Fast WiFi', 'Ergonomic Chairs', 'Green Roof'] },
  { id: '2', name: 'Eco Cafe', slug: 'eco-cafe', imageUrl: '/images/fallback.png', city: 'Bangkok', amenityNames: ['Vegan Options', 'Solar Power', 'Water Refill'] },
  { id: '3', name: 'Sustainable Stay', slug: 'sustainable-stay', imageUrl: '/images/fallback.png', city: 'Phuket', amenityNames: ['Rainwater Harvesting', 'Compost', 'EV Charging'] },
  { id: '4', name: 'Nomad Hub', slug: 'nomad-hub', imageUrl: '/images/fallback.png', city: 'Pai', amenityNames: ['Quiet Zones', 'Green Cleaning', 'Recycling'] },
];

export default function V2HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">UI v2 Sandbox</h1>
      <FeaturedListings listings={mockListings} variant="home" />
    </div>
  );
}
