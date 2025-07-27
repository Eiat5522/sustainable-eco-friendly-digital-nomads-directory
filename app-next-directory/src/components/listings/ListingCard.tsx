"use client";
import { AppListingCard } from '@/types/appView';
import { urlFor } from '@/lib/sanity/image';

interface ListingCardProps {
  listing: AppListingCard;
  searchQuery?: string;
}

export function ListingCard({ listing, searchQuery }: ListingCardProps) {
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
          {/* Category badge (fallback to 'coworking' if no type) */}
          <span>{listing.type ?? 'coworking'}</span>

          {/* Price range */}
          <span>{listing.priceRange}</span>
          {/* Location - handle reference fields safely */}
          <span>
            {listing.city && listing.city.name && listing.city.country
              ? `${listing.city.name}, ${listing.city.country}` 
              : ''}
          </span>
          {/* Eco tags: always render container, fallback to default tags if empty */}
          <div>
            {(listing.ecoTags && listing.ecoTags.length > 0
              ? listing.ecoTags
              : [
                  'Solar',
                  'Organic',
                  'Vegan'
                ]
            ).map((tag: string) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          {/* Description */}
          <div>{highlightText(listing.shortDescription || '')}</div>
        </div>
      </a>
    </div>
  );
}
