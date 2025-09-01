import { urlFor } from '@/lib/sanity/client';
import type { SanityListing, SanityImage } from '@/types/sanity.types';
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
const imageOrFallback = (img: unknown, w: number, h: number) =>
  img
    ? urlFor(img).width(w).height(h).fit('crop').auto('format').url()
    : '/images/fallback.png';

export function transformToFeaturedDTO(sanityListing: SanityListing): FeaturedListingDTO {
const imageUrl = imageOrFallback(sanityListing.primaryImage, 500, 300);

  return {
    id: sanityListing._id,
    name: sanityListing.name,
    slug: sanityListing.slug?.current ?? '',
    imageUrl,
    city: sanityListing.city?.name || '',
    amenityNames: toNames(sanityListing.amenities),  };
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
      name: a.name ?? '',
      slug: a.slug?.current ?? '',
      icon: a.icon,
      category: a.category,
    }));

// Shared helpers for simple name extraction and string validation
const isNonEmptyString = (x: unknown): x is string => typeof x === 'string' && x.length > 0;

const toNames = (
  arr?: ReadonlyArray<{ name?: string } | null | undefined>
): string[] => (arr ?? []).map(x => x?.name).filter(isNonEmptyString);

export function transformToSummaryDTO(sanityListing: DereferencedSanityListing): ListingSummaryDTO {
  const imageUrl = imageOrFallback(sanityListing.primaryImage, 500, 300);

  return {
    id: sanityListing._id,
    name: sanityListing.name,
    slug: sanityListing.slug?.current ?? '',
    type: sanityListing.type,
    city: sanityListing.city ? {
      id: sanityListing.city._id,
      name: sanityListing.city.name,
      slug: sanityListing.city.slug?.current ?? '',
      country: sanityListing.city.country ?? '',
      sustainabilityScore: toPercentage0To100(sanityListing.city.sustainabilityScore) as Percentage0To100 | undefined,
      highlights: sanityListing.city.highlights,
      description: undefined // Not fetched in this query
    } : null,
    imageUrl,
    ecoFocusTags: toNames(sanityListing.ecoFocusTags),
    digitalNomadFeatures: toNames(sanityListing.digitalNomadFeatures),
    priceRange: sanityListing.priceRange,
    website: sanityListing.website,
    address: sanityListing.address,
    location: toGeoPoint(sanityListing.location),
    shortDescription: sanityListing.shortDescription,
    amenityNames: (sanityListing.amenities ?? [])
      .map((amenity) => amenity?.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0),
  };
}
function isSanityImage(img: unknown): img is SanityImage {
  return !!img
    && typeof img === 'object'
    && 'asset' in (img as any)
    && !!(img as any).asset
    && (typeof (img as any).asset._ref === 'string' || typeof (img as any).asset._id === 'string');

export function transformToDetailDTO(sanityListing: SanityListing): ListingDetailDTO {
  // Create a proper type guard or update transformToSummaryDTO to accept SanityListing
  const baseDTO = transformToSummaryDTO(sanityListing);
  
  const galleryImages = (sanityListing.galleryImages ?? [])
    .filter(isSanityImage)
    .map(img => urlFor(img).width(800).height(600).fit('crop').auto('format').url())
    .filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);

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
