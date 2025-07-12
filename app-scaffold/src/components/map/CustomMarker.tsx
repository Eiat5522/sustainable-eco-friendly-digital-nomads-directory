"use client";

import L from 'leaflet';
import { type Listing } from '@/types/listings';

const CATEGORY_COLORS = {
  coworking: '#10B981', // green-500
  cafe: '#6366F1',      // indigo-500
  accommodation: '#EC4899' // pink-500
};

type CategoryType = keyof typeof CATEGORY_COLORS;

export function createCustomMarker(listing: Listing): L.Icon {
  const color = CATEGORY_COLORS[listing.category as CategoryType] || '#6B7280'; // gray-500 as fallback

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <path fill="${color}" d="M16 0c8.837 0 16 7.163 16 16 0 8.836-16 28-16 28S0 24.836 0 16C0 7.163 7.163 0 16 0z"/>
      <circle fill="white" cx="16" cy="16" r="6"/>
    </svg>
  `;

  const iconUrl = `data:image/svg+xml;base64,${btoa(svgIcon)}`;

  return new L.Icon({
    iconUrl,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
}

export function createPopupContent(listing: Listing): string {
  const categoryColor = CATEGORY_COLORS[listing.category as CategoryType] || '#6B7280';
  
  return `
    <div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold text-lg">${listing.name}</h3>
        <span 
          class="px-2 py-1 text-xs rounded capitalize"
          style="background-color: ${categoryColor}1A; color: ${categoryColor};"
        >
          ${listing.category}
        </span>
      </div>
      <p class="text-sm mb-3 text-gray-600">${listing.description_short}</p>
      <div class="flex gap-2 mb-3 flex-wrap">
        ${listing.eco_focus_tags.map(tag => 
          `<span 
            class="inline-block px-2 py-1 text-xs rounded capitalize"
            style="background-color: ${categoryColor}1A; color: ${categoryColor};"
          >
            ${tag.replace(/_/g, ' ')}
          </span>`
        ).join('')}
      </div>
      <a 
        href="/listings/${listing.id}" 
        class="inline-block px-4 py-2 rounded text-white transition-colors hover:opacity-90"
        style="background-color: ${categoryColor};"
      >
        View Details
      </a>
    </div>
  `;
}
