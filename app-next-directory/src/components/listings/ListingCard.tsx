"use client";
import { AppListingCard } from '@/types/appView';
import SanityImage from "@/components/SanityImage";
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
      if (listing.primaryImage) {
        // urlFor may throw, so wrap in try/catch
        return urlFor(listing.primaryImage).width(400).height(300).fit('crop').auto('format').url();
      }
      if (listing.galleryImages && listing.galleryImages.length > 0) {
        return urlFor(listing.galleryImages[0]).width(400).height(300).fit('crop').auto('format').url();
      }
    } catch (err) {
      // Fallback to default image if urlFor throws
      return '/test-image.jpg';
    }
    // Fallback if no images
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
    <div className="flex flex-col h-full justify-between bg-white rounded-lg shadow-md p-4">
      <a href={getListingUrl()} role="link">
        <div>
          {/* Image */}
          <SanityImage
            image={listing.primaryImage || (listing.galleryImages && listing.galleryImages[0])}
            alt={getName()}
            width={400}
            height={300}
            fallbackSrc="/test-image.jpg"
            fallbackAlt="Image unavailable"
            data-testid="image-mock"
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
            ).map((tag: string, i: number) => (
              <span key={tag + '-' + i}>{tag}</span>
            ))}
          </div>
          {/* Description */}
          <div>{highlightText(listing.shortDescription || '')}</div>
        </div>
      </a>
    </div>
  );
}
