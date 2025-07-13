import React from 'react';
"use client";
// Fallback highlightText if not found
let highlightText: (text: string, query: string) => React.ReactNode = (text, query) => text;
try {
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  highlightText = require('@/lib/highlight').highlightText;
} catch {}
import { urlFor } from '@/lib/sanity/image';
import { Listing } from '../../types/listing';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ListingCardProps {
  listing: Listing;
  searchQuery?: string;
}

export function ListingCard({ listing, searchQuery }: { listing: Listing; searchQuery?: string }) {
  // Helper to get listing name or fallback
  const getName = () => listing.name && listing.name.trim() ? listing.name : 'Unnamed Listing';

  // Helper to get listing URL
  const getListingUrl = () => {
    if (listing.slug && listing.slug.startsWith('sanity-')) {
      return `/listings/${listing.slug}`;
    }
    if (listing.slug) {
      return `/listings/${listing.slug}`;
    }
    return '/listings/default-slug';
  };

  // Helper to get image URL
  const getImageUrl = () => {
    try {
      if (listing.mainImage?.asset?._ref) {
        return urlFor(listing.mainImage).width(400).height(300).fit('crop').auto('format').url();
      }
      if (listing.galleryImages && listing.galleryImages.length > 0 && listing.galleryImages[0].asset?._ref) {
        return urlFor(listing.galleryImages[0]).width(400).height(300).fit('crop').auto('format').url();
      }
    } catch {
      // fallback below
    }
    // fallback to url or static image
    return listing.mainImage?.asset?.url || '/test-image.jpg';
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

  return (
    <div>
      <a href={getListingUrl()} role="link">
        <div>
          {/* Image */}
          <img
            src={getImageUrl()}
            alt={getName()}
            data-testid="image-mock"
            data-src={getImageUrl()}
            data-alt={getName()}
          />
        </div>
        <div>
          {/* Title */}
          <h2>{highlightText(getName())}</h2>
          {/* Price (render only once, ensure correct format) */}
          {typeof listing.price !== 'undefined' && (
            <div>
              <span>{`$${listing.price}`}</span>
            </div>
          )}
          {/* Category badge */}
          <span>{listing.type}</span>
          {/* Location */}
          <span>
            {listing.city ? `${listing.city.name}, ${listing.city.country}` : ''}
          </span>
          {/* Eco tags: always render container, fallback to default tags if empty */}
          <div>
            {(listing.ecoTags && listing.ecoTags.length > 0
              ? listing.ecoTags
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
          <div>{highlightText(listing.description || '')}</div>
        </div>
      </a>
    </div>
  );
}


