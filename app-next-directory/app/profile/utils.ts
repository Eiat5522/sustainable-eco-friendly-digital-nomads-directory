
export interface FavoriteListing {
  id: string;
  name: string;
  slug: string;
  city?: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface OwnerReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerImage?: string;
}

export interface OwnerListingReviews {
  slug: string;
  name: string;
  reviews: OwnerReviewItem[];
}

export type FavoriteEntry = {
  _id?: string;
  listing?: {
    _id?: string;
    name?: string;
    slug?: string;
    mainImage?: {
      asset?: {
        url?: string;
      } | null;
    } | null;
    city?: {
      name?: string;
    } | null;
  } | null;
  createdAt?: string;
};

export interface FavoritesResponse {
  favorites?: FavoriteEntry[];
}

export interface OwnerReviewsResponse {
  listings?: OwnerListingReviews[];
}

export function normaliseFavorite(entry: FavoriteEntry | undefined): FavoriteListing | null {
  if (!entry) return null;
  const listing = entry.listing ?? undefined;
  const slug = typeof listing?.slug === 'string' ? listing.slug : '';
  if (!slug) return null;
  const name = typeof listing?.name === 'string' && listing.name.trim().length > 0
    ? listing.name.trim()
    : 'Untitled listing';

  const city = typeof listing?.city?.name === 'string' ? listing.city.name : undefined;
  const imageUrl =
    typeof listing?.mainImage?.asset?.url === 'string' && listing.mainImage.asset.url.length > 0
      ? listing.mainImage.asset.url
      : undefined;

  return {
    id: entry._id ?? slug,
    name,
    slug,
    city,
    imageUrl,
    createdAt: entry.createdAt,
  };
}

export function normaliseOwnerReviews(response: OwnerReviewsResponse | null | undefined): OwnerListingReviews[] {
  if (!response?.listings || !Array.isArray(response.listings)) {
    return [];
  }

  return response.listings
    .filter((listing): listing is OwnerListingReviews => Boolean(listing?.slug))
    .map((listing) => ({
      slug: listing.slug,
      name: listing.name?.trim?.() || 'Untitled listing',
      reviews: Array.isArray(listing.reviews)
        ? listing.reviews
            .filter((review): review is OwnerReviewItem => Boolean(review && typeof review.id === 'string'))
            .map((review) => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt,
              reviewerName: review.reviewerName,
              reviewerImage: review.reviewerImage,
            }))
        : [],
    }));
}

export function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}
