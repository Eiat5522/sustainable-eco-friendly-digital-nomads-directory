'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jsonPostOptions } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import type { CityDTO, ListingDetailDTO } from '@/types/dto';
import { getCurrentHref, redirectTo } from '@/utils/navigation';
import GalleryGrid from './GalleryGrid';
import { HeroSection } from './HeroSection';
import { ListingDetailsCard } from './ListingDetailsCard';
import { RelatedListings } from './RelatedListings';
import { ReviewsSection } from './ReviewsSection';

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
    image?: string;
  };
  createdAt: string;
  status: 'pending' | 'approved';
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
  userId?: string;
}

export function ListingDetailView({
  listing,
  reviews = [],
  relatedListings = [],
  isSignedIn = false,
  isFavorited = false,
  userId,
}: ListingDetailViewProps): React.JSX.Element {
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
      } catch (_error) {
        if (process.env.NODE_ENV !== 'production') {
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
      const href = getCurrentHref();
      redirectTo(`/auth/login?callbackUrl=${encodeURIComponent(href)}`);
      return;
    }

    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);

    try {
      // Use slug for favorite toggles to keep the dynamic path consistent
      const res = await fetch(`/api/user/favorites/${listing.slug}`, jsonPostOptions({}));

      if (!res.ok) {
        structuredLogger.error('Failed to toggle favorite', undefined, {
          component: 'listings',
          status: res.status,
          statusText: res.statusText,
        });
        if (res.status === 401) {
          // Unauthorized - redirect to login
          const href = getCurrentHref();
          redirectTo(`/auth/login?callbackUrl=${encodeURIComponent(href)}`);
          return;
        }
        return;
      }

      const data = (await res.json().catch(() => null)) as { favorited?: unknown } | null;
      setFavorited(Boolean(data?.favorited));
    } catch (err) {
      structuredLogger.error('Failed to toggle favorite', err, { component: 'listings' });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const filteredRelatedListings = relatedListings.filter(related => related.id !== listing.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <HeroSection
            listing={listing}
            isFavorited={favorited}
            onToggleFavorite={onToggleFavorite}
          />

          {/* Gallery Carousel */}
          {/* Render modern gallery grid only when there are meaningful gallery images */}
          {listing.galleryImages && listing.galleryImages.length > 0 && (
            <div className="mt-8">
              <GalleryGrid images={listing.galleryImages} fallback="/placeholder_image.png" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
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
                userId={userId}
              />
            </div>
          </div>

          {/* Related Listings */}
          {filteredRelatedListings.length > 0 && (
            <div className="mt-12">
              <RelatedListings listings={filteredRelatedListings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
