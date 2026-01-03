import type React from 'react';
import { Suspense } from 'react';
import type { CityDTO, ListingDetailDTO } from '@/types/dto';
import GalleryGrid from './GalleryGrid';
import { FavoriteButtonOverlay } from './FavoriteButtonOverlay';
import { HeroSection } from './HeroSection';
import { ListingDetailsCard } from './ListingDetailsCard';
import { ListingViewTracker } from './ListingViewTracker';
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
  const filteredRelatedListings = relatedListings.filter(related => related.id !== listing.id);

  return (
    <div className="min-h-screen bg-background">
      <ListingViewTracker slug={listing.slug} />
      <div className="container mx-auto px-4 pt-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <HeroSection
            listing={listing}
            favoriteButton={
              <Suspense
                fallback={
                  <div className="bg-white/90 hover:bg-white rounded-md px-3 py-2 shadow animate-pulse" />
                }
              >
                <FavoriteButtonOverlay
                  listingSlug={listing.slug}
                  listingTitle={listing.name}
                  initialIsFavorited={isFavorited}
                />
              </Suspense>
            }
          />

          {/* Gallery Carousel */}
          {/* Render modern gallery grid only when there are meaningful gallery images */}
          {listing.galleryImages && listing.galleryImages.length > 0 && (
            <div className="mt-8">
              <Suspense
                fallback={
                  <div className="h-64 w-full rounded-lg bg-muted animate-pulse" aria-hidden="true" />
                }
              >
                <GalleryGrid images={listing.galleryImages} fallback="/placeholder_image.png" />
              </Suspense>
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
              <Suspense
                fallback={
                  <div className="h-64 w-full rounded-lg bg-muted animate-pulse" aria-hidden="true" />
                }
              >
                <ReviewsSection
                  reviews={reviews}
                  listingId={listing.id}
                  isSignedIn={isSignedIn}
                  userId={userId}
                />
              </Suspense>
            </div>
          </div>

          {/* Related Listings */}
          {filteredRelatedListings.length > 0 && (
            <div className="mt-12">
              <Suspense fallback={<div className="h-40 w-full rounded-lg bg-muted animate-pulse" />}>
                <RelatedListings listings={filteredRelatedListings} />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
