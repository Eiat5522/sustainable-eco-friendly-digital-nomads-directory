'use client';

import React, { useState } from 'react';
import GalleryGrid from "./GalleryGrid";
import { HeroSection } from './HeroSection';
import { ListingDetailsCard } from './ListingDetailsCard';
import { ReviewsSection } from './ReviewsSection';
import { RelatedListings } from './RelatedListings';
import type { ListingDetailDTO, CityDTO } from '@/types/dto';
import { getCurrentHref, redirectTo } from '@/utils/navigation';

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
    image?: string;
  };
  createdAt: string;
}

interface RelatedListing {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  city: string | CityDTO | null;
  priceRange: 'budget' | 'moderate' | 'premium';
  ecoFocusTags: string[];
}

interface ListingDetailViewProps {
  listing: ListingDetailDTO;
  reviews?: Review[];
  relatedListings?: RelatedListing[];
  isSignedIn?: boolean;
}

export function ListingDetailView({ 
  listing, 
  reviews = [], 
  relatedListings = [],
  isSignedIn = false
}: ListingDetailViewProps) {

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <HeroSection listing={listing} />

          {/* Gallery Carousel */}
          {/* Render modern gallery grid only when there are meaningful gallery images */}
          {listing.galleryImages && listing.galleryImages.length > 0 && (
            <div className="mt-8">
              <GalleryGrid images={listing.galleryImages} fallback="/placeholder_image.png" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <ListingDetailsCard listing={listing} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Reviews Section */}
              <ReviewsSection 
                reviews={reviews}
                listingId={listing.id}
                isSignedIn={isSignedIn}
              />
            </div>
          </div>

          {/* Related Listings */}
          {relatedListings.length > 0 && (
            <div className="mt-12">
              <RelatedListings listings={relatedListings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
