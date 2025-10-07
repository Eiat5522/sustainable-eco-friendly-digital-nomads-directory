export interface FavoriteImage {
  url: string;
  width: number;
  height: number;
  alt?: string;
}

export interface FavoriteListing {
  id: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
  type?: string;
  category?: string;
  shortDescription?: string;
  priceRange?: 'budget' | 'moderate' | 'premium';
  ecoFocusTags: string[];
  digitalNomadFeatures: string[];
  image?: FavoriteImage;
  imageUrl?: string;
  createdAt?: string;
}

export interface OwnerReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  reviewerName?: string;
  reviewerImage?: string;
}

export interface OwnerListingReviews {
  slug: string;
  name: string;
  reviews: OwnerReview[];
}

export type FavoriteEntry = {
  _id?: string | null;
  createdAt?: string | null;
  listing?: {
    slug?: string | null;
    name?: string | null;
    city?: { name?: string | null; country?: string | null } | null;
    country?: string | null;
    type?: string | null;
    category?: string | null;
    priceRange?: string | null;
    shortDescription?: string | null;
    ecoFocusTags?: Array<{ name?: string | null } | string | null | undefined> | null;
    digitalNomadFeatures?: Array<{ name?: string | null } | string | null | undefined> | null;
    primaryImage?: {
      asset?: {
        url?: string | null;
        metadata?: { dimensions?: { width?: number | null; height?: number | null } | null } | null;
      } | null;
      altText?: string | null;
    } | null;
    mainImage?: {
      asset?: {
        url?: string | null;
        metadata?: { dimensions?: { width?: number | null; height?: number | null } | null } | null;
      } | null;
      altText?: string | null;
    } | null;
  } | null;
};

export type OwnerReviewsResponse = {
  listings?: Array<{
    slug?: string | null;
    name?: string | null;
    reviews?: Array<{
      id?: string | null;
      rating?: number | null;
      comment?: string | null;
      createdAt?: string | null;
      reviewerName?: string | null;
      reviewerImage?: string | null;
    } | null> | null;
  } | null> | null;
};

const allowedPriceRanges = new Set<FavoriteListing['priceRange']>(['budget', 'moderate', 'premium']);

const fallbackDimensions = { width: 800, height: 600 };

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toTagList(input?: Array<{ name?: string | null } | string | null | undefined> | null): string[] {
  if (!Array.isArray(input)) return [];
  const tags: string[] = [];
  for (const tag of input) {
    if (typeof tag === 'string') {
      const name = tag.trim();
      if (name.length > 0) tags.push(name);
      continue;
    }
    if (tag && typeof tag === 'object' && typeof tag.name === 'string') {
      const name = tag.name.trim();
      if (name.length > 0) tags.push(name);
    }
  }
  return tags;
}

function extractImage(entry: FavoriteEntry['listing']): { image?: FavoriteImage; imageUrl?: string } {
  const source = entry?.primaryImage ?? entry?.mainImage ?? null;
  const asset = source?.asset ?? null;
  const rawUrl = typeof asset?.url === 'string' ? asset.url.trim() : undefined;
  if (!rawUrl || rawUrl.length === 0) {
    return {};
  }
  const rawWidth = (asset?.metadata as { dimensions?: { width?: number | null; height?: number | null } } | undefined)?.dimensions?.width;
  const rawHeight = (asset?.metadata as { dimensions?: { width?: number | null; height?: number | null } } | undefined)?.dimensions?.height;
  const width = typeof rawWidth === 'number' && Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : fallbackDimensions.width;
  const height = typeof rawHeight === 'number' && Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : fallbackDimensions.height;
  const alt = toNonEmptyString(source?.altText);
  return {
    imageUrl: rawUrl,
    image: {
      url: rawUrl,
      width,
      height,
      alt,
    },
  };
}

export function normaliseFavorite(entry: FavoriteEntry | null | undefined): FavoriteListing | null {
  if (!entry) return null;
  const listing = entry.listing ?? null;
  const rawSlug = typeof listing?.slug === 'string' ? listing.slug.trim() : undefined;
  if (!rawSlug) return null;
  const id = toNonEmptyString(entry._id) ?? rawSlug;
  const cityName = toNonEmptyString(listing?.city?.name);
  const countryName = toNonEmptyString(listing?.city?.country ?? listing?.country);
  const shortDescription = toNonEmptyString(listing?.shortDescription);
  const type = toNonEmptyString(listing?.type);
  const category = toNonEmptyString(listing?.category);
  const priceCandidate = toNonEmptyString(listing?.priceRange);
  const priceRange = priceCandidate && allowedPriceRanges.has(priceCandidate as FavoriteListing['priceRange'])
    ? (priceCandidate as FavoriteListing['priceRange'])
    : undefined;
  const { image, imageUrl } = extractImage(listing);
  const createdAt = toNonEmptyString(entry.createdAt);

  return {
    id,
    name: toNonEmptyString(listing?.name) ?? 'Untitled listing',
    slug: rawSlug,
    city: cityName,
    country: countryName,
    type,
    category,
    shortDescription,
    priceRange,
    ecoFocusTags: toTagList(listing?.ecoFocusTags),
    digitalNomadFeatures: toTagList(listing?.digitalNomadFeatures),
    image,
    imageUrl,
    createdAt,
  };
}

export function normaliseOwnerReviews(response: OwnerReviewsResponse | null | undefined): OwnerListingReviews[] {
  if (!response?.listings) return [];
  const normalised: OwnerListingReviews[] = [];
  for (const listing of response.listings) {
    const slug = toNonEmptyString(listing?.slug);
    if (!slug) continue;
    const name = toNonEmptyString(listing?.name) ?? 'Untitled listing';
    const reviews: OwnerReview[] = [];
    if (Array.isArray(listing?.reviews)) {
      for (const review of listing.reviews) {
        const id = toNonEmptyString(review?.id);
        if (!id) continue;
        const ratingValue = typeof review?.rating === 'number' ? review.rating : Number(review?.rating);
        if (!Number.isFinite(ratingValue)) continue;
        reviews.push({
          id,
          rating: ratingValue,
          comment: toNonEmptyString(review?.comment),
          createdAt: toNonEmptyString(review?.createdAt),
          reviewerName: toNonEmptyString(review?.reviewerName),
          reviewerImage: toNonEmptyString(review?.reviewerImage),
        });
      }
    }
    normalised.push({ slug, name, reviews });
  }
  return normalised;
}

export function formatDate(input?: string | null): string {
  if (!input) return 'Unknown date';
  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) return 'Unknown date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(parsed));
}
