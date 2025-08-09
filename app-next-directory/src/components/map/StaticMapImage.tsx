"use client";
import React from 'react';


import { AppListingDetail } from '@/types/appView';

interface StaticMapImageProps {
  listings: AppListingDetail[];
  width: number;
  height: number;
}

// Renders a simple static representation for SSR and SEO
export default function StaticMapImage({ listings }: StaticMapImageProps) {
  // Filter out listings that lack coordinates (support both legacy and new shapes).
  // Treat 0 as valid; avoid truthy checks and `any` casts.
  const hasCoords = (l: AppListingDetail) => {
    const lat = l?.location?.lat ?? (l as any)?.coordinates?.lat;
    const lng = l?.location?.lng ?? (l as any)?.coordinates?.lng;
    return typeof lat === 'number' && Number.isFinite(lat) &&
           typeof lng === 'number' && Number.isFinite(lng);
  };
  const validListings = listings.filter(hasCoords);

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
          {validListings.map((listing: any) => {
            const slugKey =
              typeof listing.slug === 'string'
                ? listing.slug
                : listing.slug?.current || listing.id || listing.name;
            const category = listing.category ?? listing?.type ?? 'listing';
            return (
              <li key={slugKey}>
                {listing.name} - {listing.address} ({category})
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
