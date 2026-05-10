import { ListingCandidateSchema, type ListingCandidate, type ListingType } from './schemas';

const LISTING_CANDIDATE_FIELDS = `{
  _id,
  name,
  "slug": slug.current,
  type,
  shortDescription,
  longDescription,
  address,
  location,
  website,
  priceRange,
  "imageUrl": coalesce(primaryImage.asset->url, null),
  city->{ name, country, "slug": slug.current },
  ecoFocusTags[]->{ name },
  digitalNomadFeatures[]->{ name },
  amenities[]->{ name },
  coworkingDetails,
  cafeDetails,
  restaurantDetails,
  activitiesDetails,
  accommodationDetails
}`;

const LISTING_CANDIDATES_QUERY = `*[
  _type == "listing" &&
  moderation.status == "published" &&
  lower(city->name) == $city
] | order(_updatedAt desc, _createdAt desc)[0...$limit] ${LISTING_CANDIDATE_FIELDS}`;

const LISTING_REFERENCES_QUERY = `*[
  _type == "listing" &&
  moderation.status == "published" &&
  (
    lower(name) match $pattern ||
    lower(shortDescription) match $pattern ||
    lower(city->name) match $pattern ||
    lower(type) match $pattern
  )
] | order(_updatedAt desc, _createdAt desc)[0...10] ${LISTING_CANDIDATE_FIELDS}`;

const LISTING_BY_ID_OR_SLUG_QUERY = `*[
  _type == "listing" &&
  moderation.status == "published" &&
  (_id == $identifier || slug.current == $identifier)
][0] ${LISTING_CANDIDATE_FIELDS}`;

type FetchListingCandidatesInput = {
  city: string;
  limit?: number;
};

export type ReferenceResult = {
  id: string;
  title: string;
  url: string;
};

type NameRef = {
  name?: unknown;
};

type RawCity = {
  name?: unknown;
  country?: unknown;
  slug?: unknown;
};

type RawLocation = {
  lat?: unknown;
  lng?: unknown;
};

type RawOpeningHour = {
  day?: unknown;
  opens?: unknown;
  closes?: unknown;
};

type RawDetails = {
  openingHours?: unknown;
  operatingHours?: unknown;
  internetSpeed?: unknown;
  noiseLevel?: unknown;
  dietaryOptions?: unknown;
  cuisineType?: unknown;
  duration?: unknown;
  activityType?: unknown;
  accommodationType?: unknown;
  workspaceQuality?: unknown;
};

type RawListingCandidate = {
  _id?: unknown;
  name?: unknown;
  slug?: unknown;
  type?: unknown;
  shortDescription?: unknown;
  longDescription?: unknown;
  address?: unknown;
  location?: RawLocation | null;
  website?: unknown;
  priceRange?: unknown;
  imageUrl?: unknown;
  city?: RawCity | null;
  ecoFocusTags?: unknown;
  digitalNomadFeatures?: unknown;
  amenities?: unknown;
  coworkingDetails?: RawDetails | null;
  cafeDetails?: RawDetails | null;
  restaurantDetails?: RawDetails | null;
  activitiesDetails?: RawDetails | null;
  accommodationDetails?: RawDetails | null;
};

type Fetcher = <T = unknown>(query: string, params?: Record<string, unknown>) => Promise<T | null>;

type ErrorLogger = (message: string, error: unknown, context: Record<string, string>) => void;

type WorkdayListingCandidateMessages = {
  fetchCandidatesError: string;
  searchReferencesError: string;
  fetchCandidateError: string;
};

type CreateWorkdayListingCandidateServiceOptions = {
  fetch: Fetcher;
  logError: ErrorLogger;
  component: string;
  messages?: Partial<WorkdayListingCandidateMessages>;
};

const DEFAULT_MESSAGES: WorkdayListingCandidateMessages = {
  fetchCandidatesError: 'Failed to fetch workday listing candidates',
  searchReferencesError: 'Failed to search workday listing references',
  fetchCandidateError: 'Failed to fetch workday listing candidate',
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(entry => {
      if (typeof entry === 'string') return entry.trim();
      if (entry && typeof entry === 'object') return asString((entry as NameRef).name) ?? '';
      return '';
    })
    .filter(entry => entry.length > 0);
};

const asOpeningHours = (value: unknown): Array<{ day: string; opens: string; closes: string }> => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): Array<{ day: string; opens: string; closes: string }> => {
    if (!entry || typeof entry !== 'object') return [];
    const hour = entry as RawOpeningHour;
    const day = asString(hour.day);
    const opens = asString(hour.opens);
    const closes = asString(hour.closes);
    if (!day || !opens || !closes) return [];
    return [{ day, opens, closes }];
  });
};

const isListingType = (value: unknown): value is ListingType =>
  value === 'coworking' ||
  value === 'cafe' ||
  value === 'accommodation' ||
  value === 'restaurant' ||
  value === 'activities';

const isPriceRange = (value: unknown): value is 'budget' | 'moderate' | 'premium' =>
  value === 'budget' || value === 'moderate' || value === 'premium';

const asLocation = (value: RawLocation | null | undefined): { lat: number; lng: number } | null => {
  if (!value || typeof value.lat !== 'number' || typeof value.lng !== 'number') return null;
  return { lat: value.lat, lng: value.lng };
};

const getTypeDetails = (raw: RawListingCandidate): RawDetails | null => {
  switch (raw.type) {
    case 'coworking':
      return raw.coworkingDetails ?? null;
    case 'cafe':
      return raw.cafeDetails ?? null;
    case 'restaurant':
      return raw.restaurantDetails ?? null;
    case 'activities':
      return raw.activitiesDetails ?? null;
    case 'accommodation':
      return raw.accommodationDetails ?? null;
    default:
      return null;
  }
};

const formatInternetSpeed = (value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null;
  const speed = value as { download?: unknown; upload?: unknown };
  if (typeof speed.download !== 'number') return null;
  const upload = typeof speed.upload === 'number' ? ` / ${speed.upload} Mbps up` : '';
  return `Internet speed: ${speed.download} Mbps down${upload}`;
};

const planningNotesFor = (raw: RawListingCandidate): string[] => {
  const details = getTypeDetails(raw);
  if (!details) return [];

  const notes = [
    formatInternetSpeed(details.internetSpeed),
    asString(details.noiseLevel) ? `Noise level: ${asString(details.noiseLevel)}` : null,
    asString(details.duration) ? `Duration: ${asString(details.duration)}` : null,
    asString(details.activityType) ? `Activity type: ${asString(details.activityType)}` : null,
    asString(details.accommodationType)
      ? `Accommodation type: ${asString(details.accommodationType)}`
      : null,
  ].filter((note): note is string => typeof note === 'string');

  const dietaryOptions = asStringArray(details.dietaryOptions);
  if (dietaryOptions.length > 0) notes.push(`Dietary options: ${dietaryOptions.join(', ')}`);

  const cuisines = asStringArray(details.cuisineType);
  if (cuisines.length > 0) notes.push(`Cuisine: ${cuisines.join(', ')}`);

  return notes;
};

export const mapRawListingCandidate = (raw: RawListingCandidate): ListingCandidate | null => {
  const id = asString(raw._id);
  const name = asString(raw.name);
  const slug = asString(raw.slug);
  const type = isListingType(raw.type) ? raw.type : null;
  const cityName = asString(raw.city?.name);
  const country = asString(raw.city?.country);
  const citySlug = asString(raw.city?.slug);

  if (!id || !name || !slug || !type || !cityName || !country || !citySlug) return null;

  const details = getTypeDetails(raw);
  const openingHours = [
    ...asOpeningHours(details?.openingHours),
    ...asOpeningHours(details?.operatingHours),
  ];

  const parsed = ListingCandidateSchema.safeParse({
    id,
    name,
    slug,
    type,
    city: { name: cityName, country, slug: citySlug },
    address: asString(raw.address),
    location: asLocation(raw.location),
    shortDescription: asString(raw.shortDescription),
    longDescription: asString(raw.longDescription),
    website: asString(raw.website),
    priceRange: isPriceRange(raw.priceRange) ? raw.priceRange : null,
    imageUrl: asString(raw.imageUrl),
    ecoFocusTags: asStringArray(raw.ecoFocusTags),
    digitalNomadFeatures: asStringArray(raw.digitalNomadFeatures),
    amenities: asStringArray(raw.amenities),
    openingHours,
    planningNotes: planningNotesFor(raw),
  });

  return parsed.success ? parsed.data : null;
};

export const mapRawListingCandidates = (raw: unknown): ListingCandidate[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): ListingCandidate[] => {
    if (!entry || typeof entry !== 'object') return [];
    const mapped = mapRawListingCandidate(entry as RawListingCandidate);
    return mapped ? [mapped] : [];
  });
};

export function createWorkdayListingCandidateService({
  fetch,
  logError,
  component,
  messages,
}: CreateWorkdayListingCandidateServiceOptions) {
  const resolvedMessages = { ...DEFAULT_MESSAGES, ...messages };

  return {
    async fetchListingCandidates({
      city,
      limit = 30,
    }: FetchListingCandidatesInput): Promise<ListingCandidate[]> {
      try {
        const raw = await fetch(LISTING_CANDIDATES_QUERY, {
          city: normalizeText(city),
          limit,
        });
        return mapRawListingCandidates(raw);
      } catch (error) {
        logError(resolvedMessages.fetchCandidatesError, error, {
          component,
          city,
        });
        return [];
      }
    },

    async searchListingReferences(query: string): Promise<ReferenceResult[]> {
      try {
        const pattern = `*${normalizeText(query)}*`;
        const raw = await fetch(LISTING_REFERENCES_QUERY, { pattern });
        return mapRawListingCandidates(raw).map(candidate => ({
          id: candidate.id,
          title: candidate.name,
          url: candidate.canonicalUrl,
        }));
      } catch (error) {
        logError(resolvedMessages.searchReferencesError, error, {
          component,
          query,
        });
        return [];
      }
    },

    async fetchListingCandidate(identifier: string): Promise<ListingCandidate | null> {
      try {
        const raw = await fetch(LISTING_BY_ID_OR_SLUG_QUERY, { identifier });
        if (!raw || typeof raw !== 'object') return null;
        return mapRawListingCandidate(raw as RawListingCandidate);
      } catch (error) {
        logError(resolvedMessages.fetchCandidateError, error, {
          component,
          identifier,
        });
        return null;
      }
    },
  };
}
