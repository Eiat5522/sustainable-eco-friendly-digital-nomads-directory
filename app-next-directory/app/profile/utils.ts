
export interface FavoriteListingImage {
  url: string;
  alt?: string;
  width: number;
  height: number;
}

export interface FavoriteListing {
  id: string;
  name: string;
  slug: string;
  city?: string;
  country?: string;
  image?: FavoriteListingImage;
  shortDescription?: string;
  type?: string;
  category?: string;
  priceRange?: string;
  ecoFocusTags: string[];
  digitalNomadFeatures: string[];
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
    type?: string;
    category?: string;
    priceRange?: string;
    shortDescription?: string;
    mainImage?: {
      asset?: {
        url?: string;
        metadata?: {
          dimensions?: {
            width?: number;
            height?: number;
          };
        };
      } | null;
    } | null;
    primaryImage?: {
      alt?: string;
      asset?: {
        url?: string;
        metadata?: {
          dimensions?: {
            width?: number;
            height?: number;
          };
        };
      } | null;
    } | null;
    city?: {
      name?: string;
      country?: string;
    } | null;
    ecoFocusTags?: Array<{
      name?: string;
    } | null> | null;
    digitalNomadFeatures?: Array<{
      name?: string;
    } | null> | null;
  } | null;
  createdAt?: string;
};

export interface FavoritesResponse {
  favorites?: FavoriteEntry[];
}

export interface OwnerReviewsResponse {
  listings?: OwnerListingReviews[];
}

function appendImageParams(url: string, width?: number, height?: number): string {
  try {
    const parsed = new URL(url);
    const targetWidth = width && Number.isFinite(width) ? Math.round(width) : 640;
    const targetHeight = height && Number.isFinite(height) ? Math.round(height) : 400;
    parsed.searchParams.set('w', String(targetWidth));
    parsed.searchParams.set('h', String(targetHeight));
    parsed.searchParams.set('fit', 'crop');
    parsed.searchParams.set('auto', 'format');
    return parsed.toString();
  } catch {
    return url;
  }
}

type SanityImageLike =
  | {
      alt?: string;
      asset?: {
        url?: string;
        metadata?: {
          dimensions?: {
            width?: number;
            height?: number;
          };
        };
      } | null;
    }
  | null
  | undefined;

function normaliseImage(image: SanityImageLike): FavoriteListingImage | undefined {
  if (!image || typeof image !== 'object') {
    return undefined;
  }

  const alt = typeof (image as { alt?: unknown }).alt === 'string' ? (image as { alt?: string }).alt : undefined;
  const asset = (image as { asset?: unknown }).asset as
    | {
        url?: unknown;
        metadata?: {
          dimensions?: {
            width?: unknown;
            height?: unknown;
          };
        };
      }
    | undefined;

  const url = typeof asset?.url === 'string' && asset.url.length > 0 ? asset.url : undefined;
  if (!url) {
    return undefined;
  }

  const width = Number(asset?.metadata?.dimensions?.width);
  const height = Number(asset?.metadata?.dimensions?.height);
  const parsedWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 640;
  const parsedHeight = Number.isFinite(height) && height > 0 ? Math.round(height) : 400;

  return {
    url: appendImageParams(url, parsedWidth, parsedHeight),
    alt,
    width: parsedWidth,
    height: parsedHeight,
  };
}

function normaliseStringArray(values: Array<{ name?: string } | null> | null | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => (typeof value?.name === 'string' ? value.name.trim() : ''))
    .filter((value): value is string => value.length > 0);
}

export function normaliseFavorite(entry: FavoriteEntry | undefined): FavoriteListing | null {
  if (!entry) return null;
  const listing = entry.listing;
  const slug = typeof listing?.slug === 'string' ? listing.slug : '';
  if (!slug) return null;
  const name = typeof listing?.name === 'string' && listing.name.trim().length > 0
    ? listing.name.trim()
    : 'Untitled listing';

  const city = typeof listing?.city?.name === 'string' ? listing.city.name : undefined;
  const country = typeof listing?.city?.country === 'string' ? listing.city.country : undefined;
  const image =
    normaliseImage(listing?.primaryImage ?? listing?.mainImage ?? undefined);
  const shortDescription =
    typeof listing?.shortDescription === 'string' && listing.shortDescription.trim().length > 0
      ? listing.shortDescription.trim()
      : undefined;
  const type = typeof listing?.type === 'string' ? listing.type : undefined;
  const category = typeof listing?.category === 'string' ? listing.category : undefined;
  const priceRange = typeof listing?.priceRange === 'string' ? listing.priceRange : undefined;
  const ecoFocusTags = normaliseStringArray(listing?.ecoFocusTags);
  const digitalNomadFeatures = normaliseStringArray(listing?.digitalNomadFeatures);

  return {
    id: entry._id ?? slug,
    name,
    slug,
    city,
    country,
    image,
    shortDescription,
    type,
    category,
    priceRange,
    ecoFocusTags,
    digitalNomadFeatures,
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
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
              rating: typeof review.rating === 'number' ? review.rating : 0,
              comment: typeof review.comment === 'string' ? review.comment : '',
              createdAt: typeof review.createdAt === 'string' ? review.createdAt : '',
              reviewerName: typeof review.reviewerName === 'string' ? review.reviewerName : 'Anonymous',
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
