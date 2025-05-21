"use client";

import { type Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';
import L from 'leaflet';

// Create marker icon based on listing category
export function createCustomMarker(listing: Listing | SanityListing) {
  // Determine category based on the type of listing
  const category = 'type' in listing ? listing.type : listing.category;

  const markerHtml = `
    <div class="marker-icon marker-${category}">
      <span class="sr-only">${category} marker</span>
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
  // Function to get eco tags, works with both listing formats
  const getEcoTags = (listing: Listing | SanityListing): string[] => {
    if ('eco_focus_tags' in listing && listing.eco_focus_tags) {
      // It's a Listing object
      return listing.eco_focus_tags.map(tag => tag.name);
    } else if ('ecoTags' in listing && listing.ecoTags) {
      // It's a SanityListing object
      return listing.ecoTags;
    }
    return [];
  };

  // Create popup HTML with listing data
  const popupContent = document.createElement('div');
  popupContent.className = 'listing-popup';

  // Category badge
  const badge = document.createElement('span');
  // Use 'type' for Listing and 'category' for SanityListing
  const category = 'type' in listing ? listing.type : listing.category;
  badge.className = `category-badge category-${category}`;
  badge.innerText = category.charAt(0).toUpperCase() + category.slice(1);

  // Title
  const title = document.createElement('h3');
  title.innerText = listing.name;

  // Description
  const description = document.createElement('p');
  description.className = 'description';
  // Use 'description' for Listing and 'descriptionShort' for SanityListing
  description.innerText = 'description' in listing ? listing.description : listing.descriptionShort;

  // Tags container
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'tags-container';

  // Add eco tags if available
  const ecoTags = getEcoTags(listing);
  if (ecoTags && ecoTags.length > 0) {
    ecoTags.slice(0, 3).forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'eco-tag';
      tagElement.innerText = tag.replace(/_/g, ' ');
      tagsContainer.appendChild(tagElement);
    });
  }
    // Link to details page
  const link = document.createElement('a');
  // Use 'slug' for Listing (which is a string) and 'slug.current' for SanityListing
  const slug = 'slug' in listing && typeof listing.slug === 'object' && listing.slug !== null && 'current' in listing.slug ? listing.slug.current : (listing as any).slug;
  link.href = `/listings/${slug}`;
  link.className = 'details-link';
  link.innerText = 'View Details';

  // Append all elements to popup content
  popupContent.appendChild(badge);
  popupContent.appendChild(title);
  popupContent.appendChild(description);
  popupContent.appendChild(tagsContainer);
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
    .category-badge {
      display: inline-block;
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 12px;
      color: white;
      font-weight: 500;
    }
    .category-coworking {
      background-color: #E67E22;
    }
    .category-cafe {
      background-color: #D35400;
    }
    .category-accommodation {
      background-color: #2980B9;
    }
    .description {
      margin-top: 8px;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 12px;
    }
    .eco-tag {
      background-color: #E3F2FD;
      color: #0277BD;
      padding: 3px 6px;
      font-size: 11px;
      border-radius: 10px;
    }
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
