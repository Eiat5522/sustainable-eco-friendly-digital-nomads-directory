import type { PortableTextBlock } from '@portabletext/types';
import { isImageAssetId } from '@sanity/asset-utils';
import { structuredLogger } from '@/lib/logger';
import { urlFor } from '@/lib/sanity/client';
// Ensure we have a consistent image union for DTO mapping; add a dedicated type if
// Sanity introduces a distinct gallery image schema in the future.
import type {
  BlogDetailDTO,
  BlogSummaryDTO,
  FeaturedListingDTO,
  ListingDetailDTO,
  ListingSummaryDTO,
  Money,
  OpeningHour,
  Percentage0To100,
} from '@/types/dto';
import { asISODateString, isISODateString } from '@/types/dto';
import type {
  SanityAccommodationDetails,
  SanityActivitiesDetails,
  SanityCafeDetails,
  SanityCoworkingDetails,
  SanityImage,
  SanityListing,
  SanityRestaurantDetails,
} from '@/types/sanity.types';
import { ALLOWED_CATEGORIES } from './constants/categories';

// --- Interfaces for Sanity Data Structures ---

// Input shape for dereferenced Sanity data from GROQ queries
export interface DereferencedSanityListing {
  _id: string;
  name: string;
  slug: { current: string };
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities';
  shortDescription?: string;
  longDescription?: string;
  address?: string;
  location?: { lat: number; lng: number };
  priceRange?: 'budget' | 'moderate' | 'premium';
  website?: string;
  primaryImage?: SanityImage | string | undefined; // More specific than unknown
  galleryImages?: (SanityImage | string | undefined)[]; // More specific than unknown[]
  ecoFocusTags?: ReadonlyArray<{ name?: string }>;
  digitalNomadFeatures?: ReadonlyArray<{ name?: string }>;
  amenities?: ReadonlyArray<{ name?: string }>;
  city?: {
    _id: string;
    name: string;
    country: string;
    sustainabilityScore?: number | undefined; // Will be processed by toPercentage0To100
    highlights?: string[];
    slug: { current: string };
  };
  // Type-specific details
  coworkingDetails?: SanityCoworkingDetails;
  cafeDetails?: SanityCafeDetails;
  restaurantDetails?: SanityRestaurantDetails;
  activitiesDetails?: SanityActivitiesDetails;
  accommodationDetails?: SanityAccommodationDetails;
}

// Specific Sanity detail interfaces

// Raw blog document type for transformations
interface RawBlogDocument {
  _id?: string;
  title?: string;
  slug?: string | { current: string };
  excerpt?: string;
  primaryImage?: unknown; // Handled by imageOrFallback
  tags?: unknown[]; // Handled by normalizeTags
  authorName?: string;
  publishedAt?: string;
  readingTime?: unknown; // Converted to number
  body?: unknown[]; // Mapped to array
  authorImage?: unknown; // Handled by imageOrFallback
  relatedPosts?: unknown[]; // Mapped recursively
}

// Input shape for coworking pricing plans from Sanity
type CoworkingPlanIn = { type?: string; price?: number; period?: string; features?: string[] };

// Interface for validated coworking plans
interface ValidCoworkingPlan extends CoworkingPlanIn {
  type: string;
  period: string;
  price: number;
}

// --- Utility Functions ---

function isSanityImage(img: unknown): img is SanityImage | string {
  // Accept only valid Sanity image asset ids/refs using Sanity helper
  const isAssetRef = (s: unknown): s is string => typeof s === 'string' && isImageAssetId(s);

  // Plain string must match the asset‐ref/id pattern
  if (isAssetRef(img)) return true;
  if (!img || typeof img !== 'object') return false;

  const asset = (img as Record<string, unknown>).asset as unknown;
  if (!asset || typeof asset !== 'object') return false;

  const { _ref, _id } = asset as Record<string, unknown>;
  // Validate both _ref and _id via isImageAssetId (narrow to string first)
  const refIsValid = typeof _ref === 'string' && isImageAssetId(_ref);
  const idIsValid = typeof _id === 'string' && isImageAssetId(_id);
  return refIsValid || idIsValid;
}

export const FALLBACK_IMAGE = '/placeholder_image.png';

export const imageOrFallback = (img: unknown, w: number, h: number): string => {
  // Accept full CDN URL strings (append transformations), asset ref strings, or Sanity image objects
  if (typeof img === 'string' && img.length > 0) {
    // If it looks like a full URL, append standard query params
    if (/^https?:\/\//i.test(img)) {
      try {
        const u = new URL(img);
        u.searchParams.set('w', String(w));
        u.searchParams.set('h', String(h));
        u.searchParams.set('fit', 'crop');
        u.searchParams.set('auto', 'format');
        return u.toString();
      } catch {
        // Fall back to original string if URL parsing fails
        return img;
      }
    }
    // Otherwise only treat as a Sanity asset ref/id if valid
    if (isImageAssetId(img)) {
      // biome-ignore lint/suspicious/noFocusedTests: Sanity image builder uses fit()
      return urlFor(img).width(w).height(h).fit('crop').auto('format').url();
    }
    return FALLBACK_IMAGE;
  }

  // First try Sanity image builder for proper asset refs
  if (isSanityImage(img)) {
    // biome-ignore lint/suspicious/noFocusedTests: Sanity image builder uses fit()
    return urlFor(img).width(w).height(h).fit('crop').auto('format').url();
  }

  // Null/primitive values cannot carry an asset payload.
  if (!img || typeof img !== 'object') {
    return FALLBACK_IMAGE;
  }

  // Fallback to pre-resolved asset.url if available
  const obj = img as Record<string, unknown>;
  const asset = obj.asset as Record<string, unknown> | undefined;
  const url = typeof asset?.url === 'string' ? asset.url : undefined;
  if (url) {
    try {
      const u = new URL(url);
      u.searchParams.set('w', String(w));
      u.searchParams.set('h', String(h));
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('auto', 'format');
      return u.toString();
    } catch {
      return url;
    }
  }
  return FALLBACK_IMAGE;
};

const toMoney = (
  amount?: number,
  currency = 'THB',
  unit?: 'night' | 'meal' | 'hour'
): Money | undefined => (typeof amount === 'number' ? { amount, currency, unit } : undefined);

const toOpening = (
  arr?: Array<{ day: string; opens: string; closes: string }>
): OpeningHour[] | undefined =>
  Array.isArray(arr) ? arr.map(({ day, opens, closes }) => ({ day, opens, closes })) : undefined;

// Sanitize Sanity geopoint input to ensure consumers get { lat, lng } or undefined
function toGeoPoint(
  geo?: { lat?: number; lng?: number } | null
): { lat: number; lng: number } | undefined {
  if (
    geo &&
    typeof geo.lat === 'number' &&
    typeof geo.lng === 'number' &&
    !isNaN(geo.lat) &&
    !isNaN(geo.lng)
  ) {
    return { lat: geo.lat, lng: geo.lng };
  }
  return undefined;
}

// Validate and clamp a value into a 0..100 percentage number; return undefined for invalid inputs
function toPercentage0To100(val: unknown): Percentage0To100 | undefined {
  if (val == null) return undefined;
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return undefined;
  if (num < 0) return 0 as Percentage0To100;
  if (num > 100) return 100 as Percentage0To100;
  return num as Percentage0To100;
}

// Safely map amenities, filtering out null/undefined and preserving fields
const toAmenities = (
  amenities?: Array<
    | {
        _id?: string;
        name?: string;
        slug?: { current?: string };
        icon?: string;
        category?: string;
      }
    | null
    | undefined
  >
) =>
  (amenities ?? [])
    .filter((a): a is NonNullable<typeof a> => a != null)
    .map(a => ({
      id: a._id ?? '',
      name: (a.name ?? '').trim(),
      slug: a.slug?.current ?? '',
      icon: a.icon,
      category: a.category,
    }));

const toNames = (arr?: ReadonlyArray<{ name?: string } | null | undefined>): string[] => {
  const seen = new Set<string>();
  const canon = (s: string) => s.normalize('NFKC').toLocaleLowerCase();
  const out: string[] = [];
  for (const x of arr ?? []) {
    const raw = x?.name;
    if (typeof raw !== 'string') continue;
    const n = raw.trim();
    if (!n) continue;
    const key = canon(n);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
};

// --- Transformations ---

export function transformToFeaturedDTO(sanityListing: SanityListing): FeaturedListingDTO {
  const imageUrl = imageOrFallback(sanityListing.primaryImage, 500, 300);

  return {
    id: sanityListing._id,
    name: sanityListing.name,
    slug: sanityListing.slug?.current ?? '',
    imageUrl,
    city: sanityListing.city?.name || '',
  };
}

export function transformToSummaryDTO(
  sanityListing: DereferencedSanityListing | SanityListing
): ListingSummaryDTO {
  const imageUrl = imageOrFallback(sanityListing.primaryImage, 500, 300);
  if (imageUrl === FALLBACK_IMAGE) {
    structuredLogger.warn('[DTO] Listing has missing or invalid primaryImage; using fallback image', {
      component: 'dto-transformer',
      listingId: sanityListing._id,
      listingSlug:
        typeof sanityListing.slug === 'string'
          ? sanityListing.slug
          : sanityListing.slug?.current ?? undefined,
      listingType: sanityListing.type,
    });
  }

  // Use type guard or more specific interfaces where possible instead of 'as'
  // For simplicity and to cover both SanityListing and DereferencedSanityListing,
  // we'll cast to DereferencedSanityListing for broader access, assuming it covers common fields.
  const listing = sanityListing as DereferencedSanityListing;

  // Ensure slug is always a string
  const slug = typeof listing.slug === 'string' ? listing.slug : (listing.slug?.current ?? '');

  // Coerce optional strings to undefined when null/invalid
  const shortDescription =
    typeof listing.shortDescription === 'string' ? listing.shortDescription : undefined;
  const address = typeof listing.address === 'string' ? listing.address : undefined;

  // Validate listing type or fallback to a safe default to satisfy schema
  const rawType = listing.type;
  const type = ALLOWED_CATEGORIES.has(rawType) ? rawType : 'activities';
  if (!ALLOWED_CATEGORIES.has(rawType)) {
    structuredLogger.warn(
      `[DTO] Unknown listing type "${rawType}" for listing ${listing._id}, defaulting to "activities"`
    );
  }

  // Only include website when it looks like a valid URL
  const websiteRaw = listing.website;
  let website: string | undefined;
  if (typeof websiteRaw === 'string') {
    // Only accept absolute HTTP(S) URLs
    if (/^https?:\/\//i.test(websiteRaw)) {
      try {
        new URL(websiteRaw);
        website = websiteRaw;
      } catch {
        /* ignore invalid */
      }
    }
  }

  // Normalize nested city
  const city = listing.city
    ? {
        id: listing.city._id,
        name: listing.city.name,
        slug: listing.city.slug?.current ?? '',
        country: listing.city.country,
        sustainabilityScore: toPercentage0To100(listing.city.sustainabilityScore),
        highlights: listing.city.highlights,
      }
    : null;

  return {
    id: listing._id,
    name: listing.name,
    slug,
    type,
    city,
    imageUrl,
    address,
    location: toGeoPoint(listing.location),
    shortDescription,
    website,
    amenityNames: toNames(listing.amenities),
  };
}

export function transformToDetailDTO(sanityListing: SanityListing): ListingDetailDTO {
  // Use transformToSummaryDTO which now handles SanityListing directly
  // Cast to DereferencedSanityListing for broader access in baseDTO, assuming it covers common fields.
  const baseDTO = transformToSummaryDTO(sanityListing as DereferencedSanityListing);

  const galleryImages = (sanityListing.galleryImages ?? [])
    .map((img: unknown) => imageOrFallback(img, 800, 600))
    .filter(
      (u: unknown): u is string => typeof u === 'string' && u.length > 0 && u !== FALLBACK_IMAGE
    );

  // Build discriminated union by type
  if (sanityListing.type === 'coworking' && sanityListing.coworkingDetails) {
    const s = sanityListing.coworkingDetails;
    const detailDTO: ListingDetailDTO = {
      ...baseDTO,
      type: 'coworking',
      longDescription: sanityListing.longDescription,
      galleryImages,
      amenities: toAmenities(sanityListing.amenities),
      contactPhone: sanityListing.contactPhone,
      contactEmail: sanityListing.contactEmail,
      coworkingDetails: {
        pricingPlans: (Array.isArray(s.pricingPlans)
          ? (s.pricingPlans as Array<CoworkingPlanIn>)
          : []
        )
          .filter(
            (p): p is ValidCoworkingPlan =>
              // Use the new ValidCoworkingPlan interface
              typeof p.type === 'string' && typeof p.period === 'string' && Number.isFinite(p.price)
          )
          .map(p => ({
            type: p.type,
            price: toMoney(p.price, 'THB', 'hour')!,
            period: p.period,
            features: p.features,
          })),

        openingHours: toOpening(s.openingHours),
        internetSpeed: s.internetSpeed,
      },
    };
    return detailDTO;
  }

  if (sanityListing.type === 'cafe' && sanityListing.cafeDetails) {
    const s = sanityListing.cafeDetails;
    const detailDTO: ListingDetailDTO = {
      ...baseDTO,
      type: 'cafe',
      longDescription: sanityListing.longDescription,
      galleryImages,
      amenities: toAmenities(sanityListing.amenities),
      contactPhone: sanityListing.contactPhone,
      contactEmail: sanityListing.contactEmail,
      cafeDetails: {
        openingHours: toOpening(s.openingHours),
        priceIndication: s.priceIndication,
        menuHighlights: s.menuHighlights,
        noiseLevel: s.noiseLevel,
        workPolicy: s.workPolicy,
      },
    };
    return detailDTO;
  }

  if (sanityListing.type === 'restaurant' && sanityListing.restaurantDetails) {
    const s = sanityListing.restaurantDetails;
    const avg = typeof s.averageMealPriceThb === 'number' ? s.averageMealPriceThb : undefined;
    const detailDTO: ListingDetailDTO = {
      ...baseDTO,
      type: 'restaurant',
      longDescription: sanityListing.longDescription,
      galleryImages,
      amenities: toAmenities(sanityListing.amenities),
      contactPhone: sanityListing.contactPhone,
      contactEmail: sanityListing.contactEmail,
      restaurantDetails: {
        cuisineType: s.cuisineType,
        operatingHours: undefined,
        dietaryOptions: s.dietaryOptions,
        averageMealPrice: toMoney(avg, 'THB', 'meal'),
      },
    };
    return detailDTO;
  }

  if (sanityListing.type === 'activities' && sanityListing.activitiesDetails) {
    const s = sanityListing.activitiesDetails;
    const duration =
      typeof s.duration?.value === 'number' && s.duration.value > 0
        ? `${s.duration.value} ${s.duration.unit ?? ''}`.trim()
        : undefined;
    const detailDTO: ListingDetailDTO = {
      ...baseDTO,
      type: 'activities',
      longDescription: sanityListing.longDescription,
      galleryImages,
      amenities: toAmenities(sanityListing.amenities),
      contactPhone: sanityListing.contactPhone,
      contactEmail: sanityListing.contactEmail,
      activityDetails: {
        activityType: s.activityType,
        duration,
        skillLevel: s.skillLevel,
      },
    };
    return detailDTO;
  }

  if (sanityListing.type === 'accommodation' && sanityListing.accommodationDetails) {
    const s = sanityListing.accommodationDetails;
    const detailDTO: ListingDetailDTO = {
      ...baseDTO,
      type: 'accommodation',
      longDescription: sanityListing.longDescription,
      galleryImages,
      amenities: toAmenities(sanityListing.amenities),
      contactPhone: sanityListing.contactPhone,
      contactEmail: sanityListing.contactEmail,
      accommodationDetails: {
        accommodationType: s.accommodationType,
        pricePerNight: toMoney(s.pricePerNightThb?.min, 'THB', 'night'),
        roomTypes: s.roomTypesAvailable
          ?.map((r: { type?: string }) => r.type)
          .filter((type): type is string => typeof type === 'string'),
        minimumStay: s.minimumStay,
      },
    };
    return detailDTO;
  }
  // For unexpected types, throw an error to prevent runtime issues
  throw new Error(
    `Unsupported listing type: ${sanityListing.type}. Expected one of: coworking, cafe, restaurant, activities, accommodation`
  );
}

// ===== Blog transformers =====
export function transformToBlogSummaryDTO(doc: RawBlogDocument, w = 800, h = 450): BlogSummaryDTO {
  const rt = Number.isFinite(Number(doc?.readingTime)) ? Number(doc.readingTime) : undefined;
  const slug = typeof doc?.slug === 'string' ? doc.slug : (doc?.slug?.current ?? '');
  const excerpt = typeof doc?.excerpt === 'string' ? doc.excerpt : undefined;
  const publishedAt =
    typeof doc?.publishedAt === 'string' && isISODateString(doc.publishedAt)
      ? asISODateString(doc.publishedAt)
      : undefined;
  return {
    id: doc?._id ?? '',
    title: typeof doc?.title === 'string' ? doc.title : '',
    slug,
    excerpt,
    imageUrl: imageOrFallback(doc?.primaryImage, w, h),
    tags: Array.isArray(doc?.tags)
      ? (doc.tags as unknown[])
          .filter((t): t is string => typeof t === 'string')
          .map(t => t.trim())
          .filter(Boolean)
      : undefined,
    authorName: typeof doc?.authorName === 'string' ? doc.authorName : undefined,
    publishedAt,
    readingTime: rt,
  };
}

/**
 * Create a BlogDetailDTO from a raw blog document.
 *
 * @param doc - Raw blog document (Sanity shape) containing id, title, slug, body, authorImage, relatedPosts, and other blog fields
 * @returns A BlogDetailDTO containing the blog summary fields, `body` (an array; empty if missing), `authorImageUrl`, and `relatedPosts` (array of BlogSummaryDTO when present, otherwise `undefined`)
 */
export function transformToBlogDetailDTO(doc: RawBlogDocument): BlogDetailDTO {
  const summary = transformToBlogSummaryDTO(doc, 1200, 630);
  const related = Array.isArray(doc?.relatedPosts)
    ? (doc.relatedPosts as unknown[])
        .filter(Boolean)
        .filter((p): p is RawBlogDocument => typeof p === 'object' && p !== null && '_id' in p)
        .map(p => transformToBlogSummaryDTO(p))
    : undefined;
  const authorImageUrl = imageOrFallback(doc?.authorImage, 96, 96);
  return {
    ...summary,
    body: Array.isArray(doc?.body) ? (doc.body as PortableTextBlock[]) : [],
    authorImageUrl,
    relatedPosts: related,
  };
}
