"use client";
import type { Listing } from '@/types/listings';
import type { Listing as SanityListing } from '../../../sanity.types';
import L from 'leaflet';

// Create marker icon based on listing type
export function createCustomMarker(listing: Listing | SanityListing) {
  // Determine type based on the type of listing
  const type: string = 'type' in listing ? listing.type ?? '' : '';
  const markerHtml = `
    <div class="marker-icon marker-${type}">
      <span class="sr-only">${type} marker</span>
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    className: 'custom-marker',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42]
  });
}

// Create popup content for a listing
export function createPopupContent(listing: Listing | SanityListing) {



  // Create popup HTML with listing data
  const popupContent = document.createElement('div');
  popupContent.className = 'listing-popup';

  // Category badge
  const badge = document.createElement('span');
  // Normalize the listing type in one step
  const type = (listing as any).type ?? '';
  badge.className = `type-badge type-${type}`;
  badge.innerText = type ? type[0].toUpperCase() + type.slice(1) : '';
  // Title
  const title = document.createElement('h3');
  title.innerText = listing.name ?? '';

  // Description (always use shortDescription)
  const description = document.createElement('p');
  description.className = 'description';
  description.innerText = (listing as any).shortDescription ?? '';

  // Link to details page
  const link = document.createElement('a');
  const slug = 'slug' in listing && typeof listing.slug === 'object' && listing.slug !== null && 'current' in listing.slug ? listing.slug.current : (listing as any).slug;
  link.href = `/listings/${slug}`;
  link.className = 'details-link';
  link.innerText = 'View Details';

  // Append all elements to popup content
  popupContent.appendChild(badge);
  popupContent.appendChild(title);
  popupContent.appendChild(description);
  popupContent.appendChild(link);

  // Add styles
  const style = document.createElement('style');
  style.innerHTML = `
    .listing-popup {
      padding: 0;
    }
    .listing-popup h3 {
      font-weight: 600;
      margin-top: 8px;
      margin-bottom: 6px;
    }
    .type-badge {
      display: inline-block;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 12px;
      color: white;
      font-weight: 500;
    }
    .type-coworking {
      background-color: #E67E22;
    }
    .type-cafe {
      background-color: #D35400;
    }
    .type-accommodation {
      background-color: #2980B9;
    }
    .description {
      margin-top: 8px;
      margin-bottom: 12px;
      font-size: 14px;
    }
    /* Removed eco-tag and tags-container styles */
    .details-link {
      display: block;
      text-align: center;
      background-color: #4CAF50;
      color: white;
      padding: 8px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .details-link:hover {
      background-color: #388E3C;
    }
  `;

  popupContent.appendChild(style);

  return popupContent;
}
