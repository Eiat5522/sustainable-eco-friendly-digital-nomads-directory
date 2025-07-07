import React from 'react';
"use client";
import { highlightText } from '@/lib/highlight';
import { urlFor } from '@/lib/sanity/image';
import { Listing } from '@/types/listings';
import { SanityListing } from '@/types/sanity';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ListingCardProps {
  listing: Listing | SanityListing;
  searchQuery?: string;
}

export function ListingCard({ listing, searchQuery = '' }: ListingCardProps) {
  

  const listingName =
    typeof listing === 'object' && listing !== null && 'name' in listing && (listing as any).name != null && typeof (listing as any).name === 'string'
      ? (listing as any).name
      : '';

  const isSanityListing = (currentListing: Listing | SanityListing): currentListing is SanityListing => {
    return (
      typeof currentListing === 'object' &&
      currentListing !== null &&
      '_type' in currentListing &&
      currentListing._type === 'listing'
    );
  };

  const getCategory = () => {
    if (isSanityListing(listing)) {
      return listing.category || 'Other';
    }
    if (typeof listing === 'object' && listing !== null) {
        if ('category' in listing && typeof (listing as any).category === 'string') {
            return (listing as any).category;
        }
        if ('type' in listing && typeof (listing as any).type === 'string') { // Common alternative for category
            return (listing as any).type;
        }
    }
    return 'Other';
  };

  const getImageUrl = () => {
    if (isSanityListing(listing)) {
      if (listing.primaryImage) {
        try {
          return urlFor(listing.primaryImage)
            .width(800)
            .height(480)
            .fit('crop')
            .auto('format')
            .url();
        } catch (error) {
          console.error('Error generating Sanity image URL:', error);
          return ''; // Return empty string on error to trigger fallback
        }
      }
      // Fallback: use first gallery image if primaryImage is missing
      if (Array.isArray((listing as any).galleryImages) && (listing as any).galleryImages.length > 0) {
        const firstGalleryImage = (listing as any).galleryImages[0];
        if (firstGalleryImage) {
          try {
            const urlBuilder = urlFor(firstGalleryImage);
            if (urlBuilder) {
              return urlBuilder
                .width(800)
                .height(480)
                .fit('crop')
                .auto('format')
                .url();
            }
          } catch (error) {
            console.error('Error generating Sanity gallery image URL:', error);
            return ''; // Return empty string on error to trigger fallback
          }
        }
      }
    } else if (typeof listing === 'object' && listing !== null && 'primary_image_url' in listing && (listing as any).primary_image_url != null && typeof (listing as any).primary_image_url === 'string') {
      return (listing as any).primary_image_url;
    } else if (Array.isArray((listing as any).images) && (listing as any).images.length > 0) {
      return (listing as any).images[0];
    }
    return '';
  };

  const getListingUrl = () => {
    let slug: string | undefined | null = null;
    if (isSanityListing(listing)) {
      slug = listing.slug;
    } else if (typeof listing === 'object' && listing !== null && 'slug' in listing && typeof (listing as any).slug === 'string') {
      slug = (listing as any).slug;
    }
    return `/listings/${slug || 'default-slug'}`; // Provide a fallback slug
  };

  const getDescription = () => {
    if (isSanityListing(listing)) {
      // Handle both description_short (from query) and descriptionShort (legacy/camelCase)
      return (listing as any).description_short || (listing as any).descriptionShort || '';
    }
    if (typeof listing === 'object' && listing !== null) {
      if ('description_short' in listing && typeof (listing as any).description_short === 'string') {
        return (listing as any).description_short;
      }
      if ('description' in listing && typeof (listing as any).description === 'string') {
        return (listing as any).description;
      }
    }
    return '';
  };

  const getEcoTags = (): string[] => {
    if (isSanityListing(listing)) {
        if (Array.isArray(listing.ecoTags)) {
            return listing.ecoTags;
        }
    } else if (typeof listing === 'object' && listing !== null && 'eco_focus_tags' in listing && Array.isArray((listing as any).eco_focus_tags)) {
        return ((listing as any).eco_focus_tags as any[]).map(tag => {
            if (typeof tag === 'string') {
                return tag;
            }
            if (typeof tag === 'object' && tag !== null && 'name' in tag) {
                return (tag as any).name;
            }
            return '';
        }).filter(Boolean);
    }
    return [];
};

  const getLocation = () => {
    if (isSanityListing(listing)) {
      return `${listing.city?.title}, Thailand`;
    } else if (typeof listing === 'object' && listing !== null && 'location' in listing && typeof (listing as any).location === 'string') {
      return (listing as any).location;
    } else if (typeof listing === 'object' && listing !== null && 'city' in listing && typeof (listing as any).city === 'object') {
      return `${(listing as any).city.title}, ${(listing as any).city.country}`;
    }
    return '';
  };

  return (
    <Link href={getListingUrl()}>
      <div className="group h-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
              src={getImageUrl() || "/test-image.jpg"}
              alt={listingName || "Unnamed Listing"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              data-testid="image-mock"
            />

          {/* Category Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm">
              {getCategory()}
            </span>
          </div>

          {/* Loading State Overlay */}
          
        </div>

        {/* Content Section */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
            {searchQuery
              ? highlightText(listingName || 'Unnamed Listing', searchQuery)
              : (listingName || 'Unnamed Listing')}
          </h3>

          {/* Location */}
          <div className="flex items-center text-gray-600 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{getLocation()}</span>
          </div>

          <p className="text-gray-600 mb-4 line-clamp-2">
            {searchQuery
              ? highlightText(getDescription(), searchQuery)
              : getDescription()}
          </p>

          {/* Price */}
          {(listing as any).price && (
            <p className="text-lg font-semibold text-gray-800">${(listing as any).price}</p>
          )}

          {/* Eco Tags */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {getEcoTags()
              .slice(0, 3)
              .map((tag: string, index: number) => ( // Added types for map callback
                <span
                  key={index}
                  className={`px-2 py-1 text-sm text-gray-700 rounded-full ${['bg-green-50', 'bg-green-100', 'bg-green-200'][index % 3]}`}
                >
                  {searchQuery ? highlightText(tag, searchQuery) : tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </Link>
  );
}