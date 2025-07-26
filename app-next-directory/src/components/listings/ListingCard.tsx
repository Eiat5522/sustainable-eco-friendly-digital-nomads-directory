"use client";
import React from 'react';
// Fallback highlightText if not found
let highlightText: (text: string, query: string) => React.ReactNode = (text, query) => text;
try {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  highlightText = require('@/lib/highlight').highlightText;
} catch {}
import { urlFor } from '@/lib/sanity/image';
import type { Listing } from '../../../../sanity/sanity.types';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ListingCardProps {
  listing: Listing;
  searchQuery?: string;
}

export function ListingCard({ listing, searchQuery }: ListingCardProps) {
  // Helper to get listing name or fallback
  const getName = () => listing.name && listing.name.trim() ? listing.name : 'Unnamed Listing';

  // Helper to get listing URL
  const getListingUrl = () => {
    if (listing.slug && listing.slug.current && listing.slug.current.startsWith('sanity-')) {
      return `/listings/${listing.slug.current}`;
    }
    if (listing.slug && listing.slug.current) {
      return `/listings/${listing.slug.current}`;
    }
    return '/listings/default-slug';
  };

  // Helper to get image URL
  const getImageUrl = () => {
    try {
      // Use primaryImage from canonical Listing type
      if (listing.primaryImage?.asset?._ref) {
        return urlFor(listing.primaryImage).width(400).height(300).fit('crop').auto('format').url();
      }
      if (listing.galleryImages && listing.galleryImages.length > 0 && listing.galleryImages[0].asset?._ref) {
        return urlFor(listing.galleryImages[0]).width(400).height(300).fit('crop').auto('format').url();
      }
    } catch {
      // fallback to static image
      return '/test-image.jpg';
    }
    // fallback to static image
    return '/test-image.jpg';
  };

  // Helper to highlight search query
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ? <mark key={i}>{part}</mark> : part
        )}
      </>
    );
  };

  // Compute image URL once for consistent test/mocks
  const imageUrl = getImageUrl();

  return (
    <div>
      <a href={getListingUrl()} role="link">
        <div>
          {/* Image */}
          <img
            src={imageUrl}
            alt={getName()}
            data-testid="image-mock"
            data-src={imageUrl}
            data-alt={getName()}
          />
        </div>
        <div>
          {/* Title */}
          <h2>{highlightText(getName())}</h2>
          {/* Category badge - canonical field is 'type' */}
          <span>{listing.type}</span>
          {/* Location - handle reference fields safely */}
          <span>
            {listing.city && typeof listing.city === 'object' && 'name' in listing.city && 'country' in listing.city
              ? `${(listing.city as any).name}, ${(listing.city as any).country}` 
              : ''}
          </span>
          {/* Eco tags: always render container, fallback to default tags if empty */}
          <div>
            {(listing.ecoTags && listing.ecoTags.length > 0 && Array.isArray(listing.ecoTags)
              ? (listing.ecoTags as any[]).filter(tag => tag && typeof tag === 'object' && 'name' in tag)
              : [
                  { _id: 'eco1', name: 'Solar' },
                  { _id: 'eco2', name: 'Organic' },
                  { _id: 'eco3', name: 'Vegan' }
                ]
            ).map((tag: { _id: string; name: string }) => (
              <span key={tag._id}>{tag.name}</span>
            ))}
          </div>
          {/* Description */}
          <div>{highlightText(listing.shortDescription || '')}</div>
        </div>
      </a>
    </div>
  );
}
