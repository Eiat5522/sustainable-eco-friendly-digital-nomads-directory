"use client";

import { type Listing } from '@/types/listings';

interface StaticMapImageProps {
  listings: Listing[];
  width: number;
  height: number;
}

// Renders a simple static representation for SSR and SEO
export default function StaticMapImage({ listings }: StaticMapImageProps) {
  // Filter out listings without coordinates
  const validListings = listings.filter(
    listing => listing.coordinates.latitude && listing.coordinates.longitude
  );

  return (
    <div className="relative w-full h-[600px] rounded-lg shadow-lg overflow-hidden bg-gray-100">
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        <div className="text-gray-500 mb-4">Loading interactive map...</div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Coworking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Cafes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500"></span>
            <span>Accommodation</span>
          </div>
        </div>
      </div>
      {/* SEO content */}
      <div className="sr-only">
        <h2>Sustainable Locations Map</h2>
        <p>
          Interactive map showing {validListings.length} sustainable locations across Thailand,
          including eco-friendly coworking spaces, cafes, and accommodations.
        </p>
        <ul>
          {validListings.map(listing => (
            <li key={listing.id}>
              {listing.name} - {listing.address_string} ({listing.category})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
