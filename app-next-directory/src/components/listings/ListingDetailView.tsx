'use client';

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NeoButton } from '@/components/ui/neo-button';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { HeroSection } from './HeroSection';
import { ListingDetailsCard } from './ListingDetailsCard';
import { ReviewsSection } from './ReviewsSection';
import { RelatedListings } from './RelatedListings';
import type { ListingDetailDTO, CityDTO } from '@/types/dto';

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
  isFavorited?: boolean;
}

export function ListingDetailView({ 
  listing, 
  reviews = [], 
  relatedListings = [],
  isSignedIn = false,
  isFavorited = false 
}: ListingDetailViewProps) {
  const [favorited, setFavorited] = useState(isFavorited);

  const handleToggleFavorite = () => {
    setFavorited(!favorited);
    // In a real app, this would make an API call
    console.log('Toggle favorite for listing:', listing.id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/">
          <NeoButton variant="outline" size="sm" className="mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Back to Listings
          </NeoButton>
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <HeroSection 
            listing={listing}
            isFavorited={favorited}
            onToggleFavorite={handleToggleFavorite}
          />

          {/* Gallery Carousel */}
          {listing.galleryImages && listing.galleryImages.length > 0 && (
            <div className="mb-8">
              <ImageCarousel 
                images={listing.galleryImages}
                alt={listing.name}
              />
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
