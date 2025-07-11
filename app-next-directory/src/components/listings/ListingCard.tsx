import React from 'react';
"use client";
import { highlightText } from '@/lib/highlight';
import { urlFor } from '@/lib/sanity/image';
import { Listing } from '../../types/listing';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ListingCardProps {
  listing: Listing;
  searchQuery?: string;
}

export function ListingCard({ listing, searchQuery = '' }: ListingCardProps) {
  

  const listingName = listing.name || '';

  // Removed SanityListing type guard

  const getCategory = () => {
    // Category mapping for legacy listings
    const categoryMap: Record<string, string> = {
      accommodation: 'Hotel',
      apartment: 'Apartment',
      coworking: 'Coworking',
      cafe: 'Cafe',
    };
    if ('type' in listing && typeof listing.type === 'string') {
      return categoryMap[listing.type] || listing.type || 'Other';
    }
    return 'Other';
  };

  const getImageUrl = () => {
    if (listing.mainImage && listing.mainImage.asset.url) {
      return listing.mainImage.asset.url;
    }
    if (Array.isArray(listing.galleryImages) && listing.galleryImages.length > 0) {
      return listing.galleryImages[0].asset.url;
    }
    return '';
  };

  const getListingUrl = () => {
    return `/listings/${listing.slug || 'default-slug'}`;
  };

  const getDescription = () => {
    return listing.description || '';
  };

  const getEcoTags = (): string[] => {
    return Array.isArray(listing.ecoTags) ? listing.ecoTags.map(tag => tag.name) : [];
};

  const getLocation = () => {
    return `${listing.city.name}, ${listing.city.country}`;
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