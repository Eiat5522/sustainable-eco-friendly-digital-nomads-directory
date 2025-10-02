'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
  isFavorited?: boolean;
}

export function ListingDetailView({ 
  listing, 
  reviews = [], 
  relatedListings = [],
  isSignedIn = false
  , isFavorited = false
}: ListingDetailViewProps) {
  const [favorited, setFavorited] = useState<boolean>(Boolean(isFavorited));
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();

    const recordView = async () => {
      // Use slug for routing/identification in URLs (dynamic route uses [slug])
      if (!listing?.slug) return;

      // CRITICAL: Only record views on listing detail pages (/listings/[slug])
      // This prevents the view recording from being triggered on other pages like the home page
      if (!pathname || !pathname.startsWith('/listings/')) {
        return;
      }

      // Skip recording views during unit tests to avoid leaking fetch
      // calls into test assertions (Jest sets NODE_ENV to 'test').
      if (process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined') {
        return;
      }

      try {
        await fetch(`/api/listings/${listing.slug}/views`, {
          method: 'POST',
          signal: controller.signal,
        });
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to record listing view', error);
        }
      }
    };

    recordView();

    return () => {
      controller.abort();
    };
  }, [listing?.slug, pathname]);

  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  const onToggleFavorite = async () => {
    // If the user isn't signed in, redirect to login with callback
    if (!isSignedIn) {
      const href = getCurrentHref()
      redirectTo(`/auth/login?callbackUrl=${encodeURIComponent(href)}`)
      return
    }

    try {
      // Use slug for favorite toggles to keep the dynamic path consistent
      const res = await fetch(`/api/user/favorites/${listing.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        if (res.status === 401) {
          // Unauthorized - redirect to login
          const href = getCurrentHref()
          redirectTo(`/auth/login?callbackUrl=${encodeURIComponent(href)}`)
          return
        }

        console.error('Failed to toggle favorite:', res.status, res.statusText)
        return
      }

      // Prevent double-clicks
      if (isTogglingFavorite) return;
      setIsTogglingFavorite(true);
      const data = await res.json()
      setFavorited(Boolean(data?.favorited))
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <HeroSection listing={listing} isFavorited={favorited} onToggleFavorite={onToggleFavorite} />

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
                listingId={listing.slug}
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
