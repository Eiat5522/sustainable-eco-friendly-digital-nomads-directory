import type React from 'react';
import type { CityDTO, ListingDetailDTO } from '@/types/dto';
import { FavoriteButtonOverlay } from './FavoriteButtonOverlay';
import GalleryGrid from './GalleryGrid';
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
              <FavoriteButtonOverlay
                listingSlug={listing.slug}
                listingTitle={listing.name}
                initialIsFavorited={isFavorited}
              />
            }
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
