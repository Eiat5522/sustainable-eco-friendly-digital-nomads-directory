import { urlFor } from '@/lib/sanity/client';
import type { SanityListing, SanityImage } from '@/types/sanity.types';
import { isImageAssetId } from '@sanity/asset-utils';
// Ensure we have a consistent image union for dto mapping
// type SanityGalleryImage = SanityImage // If separate type exists in future, import it accordingly
import type { ListingDetailDTO, ListingSummaryDTO, FeaturedListingDTO, Money, OpeningHour, Percentage0To100 } from '@/types/dto';

// Input shape for dereferenced Sanity data from GROQ queries
interface DereferencedSanityListing {
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
  primaryImage?: unknown;
  galleryImages?: unknown[];
  ecoFocusTags?: ReadonlyArray<{ name?: string }>;
  digitalNomadFeatures?: ReadonlyArray<{ name?: string }>;
  amenities?: ReadonlyArray<{ name?: string }>;
  city?: {
    _id: string;
    name: string;
    country: string;
    sustainabilityScore?: number;
    highlights?: string[];
    slug: { current: string };
  };
}
function isSanityImage(img: unknown): img is SanityImage | string {
  // Accept only valid Sanity image asset ids/refs using Sanity helper
  const isAssetRef = (s: unknown): s is string =>
    typeof s === 'string' && isImageAssetId(s);

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

const imageOrFallback = (img: unknown, w: number, h: number) => {
  // Accept full CDN URL strings (append transformations), asset ref strings, or Sanity image objects
  if (typeof img === 'string' && img.length > 0) {
    // If it looks like a full URL, append standard query params
    if (/^https?:\/\//i.test(img)) {
      const hasQuery = img.includes('?');
      const qp = `w=${w}&h=${h}&fit=crop&auto=format`;
      return hasQuery ? `${img}&${qp}` : `${img}?${qp}`;
    }
    // Otherwise only treat as a Sanity asset ref/id if valid
    if (isImageAssetId(img)) {
      return urlFor(img).width(w).height(h).fit('crop').auto('format').url();
    }
    return '/images/fallback.png';
  }

  if (img && typeof img === 'object') {
    const obj = img as Record<string, unknown>;
    const asset = obj.asset as Record<string, unknown> | undefined;
    const url = typeof asset?.url === 'string' ? asset.url : undefined;
    if (url) {
      const hasQuery = url.includes('?');
      const qp = `w=${w}&h=${h}&fit=crop&auto=format`;
      return hasQuery ? `${url}&${qp}` : `${url}?${qp}`;
    }
  }

  if (isSanityImage(img)) {
    return urlFor(img).width(w).height(h).fit('crop').auto('format').url();
  }
  return '/images/fallback.png';
};

export function transformToFeaturedDTO(sanityListing: SanityListing): FeaturedListingDTO {
  const imageUrl = imageOrFallback(sanityListing.primaryImage, 500, 300);

  return {
    id: sanityListing._id,
    name: sanityListing.name,
    slug: sanityListing.slug?.current ?? '',
    imageUrl,
    city: sanityListing.city?.name || '',
    amenityNames: toNames(sanityListing.amenities),
  };
}

const toMoney = (amount?: number, currency = 'THB', unit?: 'night' | 'meal' | 'hour'): Money | undefined =>
  typeof amount === 'number' ? { amount, currency, unit } : undefined;

const toOpening = (arr?: Array<{ day: string; opens: string; closes: string }>): OpeningHour[] | undefined =>
  Array.isArray(arr) ? arr.map(({ day, opens, closes }) => ({ day, opens, closes })) : undefined;

// Sanitize Sanity geopoint input to ensure consumers get { lat, lng } or undefined
function toGeoPoint(geo?: { lat?: number; lng?: number } | null): { lat: number; lng: number } | undefined {
  if (geo && typeof geo.lat === 'number' && typeof geo.lng === 'number' && !isNaN(geo.lat) && !isNaN(geo.lng)) {
    return { lat: geo.lat, lng: geo.lng };
  }
  return undefined;
}

// Validate and clamp a value into a 0..100 percentage number; return undefined for invalid inputs
function toPercentage0To100(val: unknown): number | undefined {
  if (val == null) return undefined;
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num) || Number.isNaN(num)) return undefined;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
}

// Input shape for coworking pricing plans from Sanity
type CoworkingPlanIn = { type?: string; price?: number; period?: string; features?: string[] };

// Safely map amenities, filtering out null/undefined and preserving fields
const toAmenities = (
  amenities?: Array<{
    _id?: string
    name?: string
    slug?: { current?: string }
    icon?: string
    category?: string
  } | null | undefined>
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

// Shared helpers for simple name extraction and string validation
const isNonEmptyString = (x: unknown): x is string => typeof x === 'string' && x.length > 0;

const toNames = (
  arr?: ReadonlyArray<{ name?: string } | null | undefined>
): string[] => {
  const seen = new Set<string>();
  const canon = (s: string) => s.normalize('NFKC').toLocaleLowerCase();
  const out: string[] = [];
  for (const x of arr ?? []) {
    const raw = x?.name;
    if (typeof raw !== 'string') continue;
    const n = raw.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
};

export function transformToSummaryDTO(sanityListing: DereferencedSanityListing): ListingSummaryDTO;
export function transformToSummaryDTO(sanityListing: SanityListing): ListingSummaryDTO;
export function transformToSummaryDTO(
  sanityListing: DereferencedSanityListing | SanityListing
): ListingSummaryDTO {
  const imageUrl = imageOrFallback(sanityListing.primaryImage, 500, 300);

  return {
    id: sanityListing._id,
    name: sanityListing.name,
    slug: typeof (sanityListing as any).slug === 'string'
      ? (sanityListing as any).slug
      : (sanityListing as any).slug?.current ?? '',
    imageUrl,
    address: sanityListing.address,
    location: toGeoPoint(sanityListing.location),
    shortDescription: sanityListing.shortDescription,
    type: sanityListing.type,
    city: sanityListing.city ? {
      id: sanityListing.city._id,
      name: sanityListing.city.name,
      slug: sanityListing.city.slug.current,
      country: sanityListing.city.country,
      sustainabilityScore: toPercentage0To100(sanityListing.city.sustainabilityScore) as Percentage0To100 | undefined,
      highlights: sanityListing.city.highlights,
    } : null,
      amenityNames: toNames(sanityListing.amenities)
  };
}

export function transformToDetailDTO(sanityListing: SanityListing): ListingDetailDTO {
  // Create a proper type guard or update transformToSummaryDTO to accept SanityListing
  const baseDTO = transformToSummaryDTO(sanityListing);
  
  const galleryImages = (sanityListing.galleryImages ?? [])
    .map(img => imageOrFallback(img, 800, 600))
    .filter((u: unknown): u is string => typeof u === 'string' && u.length > 0 && u !== '/images/fallback.png');

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
       pricingPlans: (Array.isArray(s.pricingPlans) ? (s.pricingPlans as CoworkingPlanIn[]) : [])
        .filter((p): p is Required<Pick<CoworkingPlanIn, 'type' | 'price' | 'period'>> & Pick<CoworkingPlanIn, 'features'> =>
          typeof p.type === 'string' && typeof p.period === 'string' && Number.isFinite(p.price as number)
        )
        .map(p => ({
          type: p.type,
          price: toMoney(p.price as number, 'THB', 'hour') as Money,
          period: p.period,
          features: p.features,
        })),
        
        openingHours: toOpening(s.openingHours),
        internetSpeed: s.internetSpeed
      }
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
        workPolicy: s.workPolicy
      }
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
        operatingHours: undefined, // source is string; keep undefined until structured source available
        dietaryOptions: s.dietaryOptions,
        averageMealPrice: toMoney(avg, 'THB', 'meal')
      }
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
        // Add other activity-specific fields as needed
      }
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
        roomTypes: s.roomTypesAvailable?.map(r => r.type),
        minimumStay: s.minimumStay
      }
    };
    return detailDTO;
  }
  // Log warning for unexpected types
  // For unexpected types, throw an error to prevent runtime issues
  throw new Error(`Unsupported listing type: ${sanityListing.type}. Expected one of: coworking, cafe, restaurant, activities, accommodation`);
}