import type { CityDetailDTO, CityDTO, ListingSummaryDTO } from '@/types/dto';
import type { SearchParamRecord } from '@/types/search';

export type E2EDiscoveryListing = {
  readonly _id: string;
  readonly name: string;
  readonly slug: string;
  readonly category: ListingSummaryDTO['type'];
  readonly city: {
    readonly _id: string;
    readonly name: string;
    readonly slug: string;
    readonly country: string;
  };
  readonly shortDescription?: string;
  readonly amenityNames: readonly string[];
  readonly ecoFocusTags: readonly string[];
  readonly digitalNomadFeatures?: readonly string[];
  readonly location?: { readonly lat: number; readonly lng: number };
  readonly primaryImageUrl?: string;
  readonly priceRange?: ListingSummaryDTO['priceRange'];
  readonly featured?: boolean;
  readonly address?: string;
};

type FacetBuckets = {
  category: Array<{ value: string; count: number }>;
  destination: Array<{ value: string; count: number }>;
  amenities: Array<{ value: string; count: number }>;
};

type SearchComputationParams = {
  readonly q: string;
  readonly categories: readonly string[];
  readonly destinations: readonly string[];
  readonly amenities: readonly string[];
  readonly nomadFeatures: readonly string[];
  readonly page: number;
  readonly limit: number;
  readonly includeFacets: boolean;
};

type SearchComputationResult = {
  results: Array<{
    _id: string;
    name: string;
    slug: string;
    category: string;
    city: {
      _id: string;
      name: string;
      slug: string;
      country: string;
    };
    [key: string]: unknown;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  facets?: FacetBuckets;
  filters: {
    query: string;
    category: readonly string[];
    destination: readonly string[];
    amenities: readonly string[];
    nomadFeatures: readonly string[];
  };
};

const discoveryListings: readonly E2EDiscoveryListing[] = [
  {
    _id: 'listing-green-cowork-bangkok',
    name: 'Green Cowork Bangkok',
    slug: 'green-cowork-bangkok',
    category: 'coworking',
    city: {
      _id: 'city-bangkok',
      name: 'Bangkok',
      slug: 'bangkok',
      country: 'Thailand',
    },
    shortDescription: 'A leafy coworking hub focused on renewable energy.',
    amenityNames: ['Fast WiFi', 'Quiet Zones', 'Solar Powered'],
    ecoFocusTags: ['Solar Powered', 'Zero Waste'],
    digitalNomadFeatures: ['Fast WiFi', '24/7 Access'],
    location: { lat: 13.7563, lng: 100.5018 },
    primaryImageUrl: '/placeholder_image.png',
    priceRange: 'moderate',
    featured: true,
    address: '123 Green Road, Bangkok',
  },
  {
    _id: 'listing-eco-stay-chiang-mai',
    name: 'Eco Stay Chiang Mai',
    slug: 'eco-stay-chiang-mai',
    category: 'accommodation',
    city: {
      _id: 'city-chiang-mai',
      name: 'Chiang Mai',
      slug: 'chiang-mai',
      country: 'Thailand',
    },
    shortDescription: 'Sustainable coliving with rainwater harvesting and organic meals.',
    amenityNames: ['Organic Kitchen', 'Community Garden', 'Fast WiFi'],
    ecoFocusTags: ['Rainwater Harvesting', 'Organic Produce'],
    digitalNomadFeatures: ['Private Suites', 'Remote Work Desks'],
    location: { lat: 18.7883, lng: 98.9853 },
    primaryImageUrl: '/placeholder_image.png',
    priceRange: 'moderate',
    address: '42 Eco Lane, Chiang Mai',
  },
  {
    _id: 'listing-plant-cafe-chiang-mai',
    name: 'Plant Powered Cafe',
    slug: 'plant-powered-cafe',
    category: 'cafe',
    city: {
      _id: 'city-chiang-mai',
      name: 'Chiang Mai',
      slug: 'chiang-mai',
      country: 'Thailand',
    },
    shortDescription: 'Plant-based cafe with fair-trade coffee and reuse initiatives.',
    amenityNames: ['Power Outlets', 'Community Events'],
    ecoFocusTags: ['Plant Based', 'Reusable Cup Program'],
    digitalNomadFeatures: ['Focus Rooms'],
    location: { lat: 18.795, lng: 99.001 },
    primaryImageUrl: '/placeholder_image.png',
    priceRange: 'budget',
    address: '88 Garden Street, Chiang Mai',
  },
  {
    _id: 'listing-ocean-colab-phuket',
    name: 'Ocean Colab Phuket',
    slug: 'ocean-colab-phuket',
    category: 'coworking',
    city: {
      _id: 'city-phuket',
      name: 'Phuket',
      slug: 'phuket',
      country: 'Thailand',
    },
    shortDescription: 'Seaside coworking with solar shading and ocean cleanup drives.',
    amenityNames: ['Fast WiFi', 'Ocean View Terrace'],
    ecoFocusTags: ['Marine Conservation', 'Solar Shading'],
    digitalNomadFeatures: ['Community Events'],
    location: { lat: 7.8804, lng: 98.3923 },
    primaryImageUrl: '/placeholder_image.png',
    priceRange: 'premium',
    address: '17 Beach Walk, Phuket',
  },
  {
    _id: 'listing-forest-retreat-chiang-mai',
    name: 'Forest Retreat Chiang Mai',
    slug: 'forest-retreat-chiang-mai',
    category: 'accommodation',
    city: {
      _id: 'city-chiang-mai',
      name: 'Chiang Mai',
      slug: 'chiang-mai',
      country: 'Thailand',
    },
    shortDescription: 'Nature-first retreat with carbon-neutral lodging and forest bathing.',
    amenityNames: ['Forest Trails', 'Solar Powered'],
    ecoFocusTags: ['Carbon Neutral', 'Native Forestry'],
    digitalNomadFeatures: ['Wellness Programs'],
    location: { lat: 18.8062, lng: 98.9626 },
    primaryImageUrl: '/placeholder_image.png',
    priceRange: 'premium',
    address: '5 Canopy Road, Chiang Mai',
  },
];

const discoveryCities: readonly CityDetailDTO[] = [
  {
    id: 'city-bangkok',
    name: 'Bangkok',
    slug: 'bangkok',
    country: 'Thailand',
    highlights: ['Green rooftops', 'Bike lanes', 'River taxis'],
    description:
      'Bangkok is embracing sustainability through green rooftops, river revitalisation, and low-carbon mobility.',
    shortDescription: 'High-energy capital with a growing network of sustainable work hubs.',
    sustainabilityScore: 72 as CityDTO['sustainabilityScore'],
    imageUrl: '/placeholder_image.png',
    airQuality: 'Variable — improving during cooler seasons',
    internetSpeed: 250,
    costOfLiving: 'Moderate',
    climate: 'Tropical',
    safety: 'Generally safe with vibrant expat communities',
    walkability: 'High in core neighbourhoods',
    sustainabilityInitiatives: [
      'Solar rooftops for coworking hubs',
      'Expanded urban rail network',
      'Community recycling drives',
    ],
    digitalNomadFeatures: ['Abundant coworking spaces', 'Night markets', 'Riverfront cafes'],
    galleryImages: [],
  },
  {
    id: 'city-chiang-mai',
    name: 'Chiang Mai',
    slug: 'chiang-mai',
    country: 'Thailand',
    highlights: ['Old city sustainability plan', 'Organic markets', 'Mountain escapes'],
    description:
      'Chiang Mai blends heritage, sustainability, and creative energy with slow-living initiatives.',
    shortDescription: 'Creative capital of the north with thriving eco communities.',
    sustainabilityScore: 86 as CityDTO['sustainabilityScore'],
    imageUrl: '/placeholder_image.png',
    airQuality: 'Improving outside of burning season',
    internetSpeed: 180,
    costOfLiving: 'Affordable',
    climate: 'Tropical savanna',
    safety: 'Calm and community focused',
    walkability: 'Compact old town core',
    sustainabilityInitiatives: ['Car-free weekends', 'Zero-waste markets', 'Community composting'],
    digitalNomadFeatures: ['Creative hubs', 'Cafes with meeting rooms', 'Nature escapes'],
    galleryImages: [],
  },
  {
    id: 'city-phuket',
    name: 'Phuket',
    slug: 'phuket',
    country: 'Thailand',
    highlights: ['Marine conservation', 'Green hospitality', 'Cycle-friendly routes'],
    description:
      'Phuket is building a blue economy with marine conservation corridors and eco stays.',
    shortDescription: 'Island innovation hub with ocean-forward sustainability.',
    sustainabilityScore: 69 as CityDTO['sustainabilityScore'],
    imageUrl: '/placeholder_image.png',
    airQuality: 'Coastal breezes',
    internetSpeed: 160,
    costOfLiving: 'Moderate',
    climate: 'Tropical monsoon',
    safety: 'Tourist focused with eco guardians',
    walkability: 'Walkable beach districts',
    sustainabilityInitiatives: ['Coral reef protection', 'Plastic-free beach pilots'],
    digitalNomadFeatures: ['Ocean views', 'Island excursions'],
    galleryImages: [],
  },
];

export const e2eFilterMetadata = {
  cities: discoveryCities.map(city => ({
    _id: city.id,
    name: city.name,
    slug: { current: city.slug } as const,
  })),
  categories: Array.from(new Set(discoveryListings.map(listing => listing.category))),
  amenities: Array.from(
    new Set(
      discoveryListings
        .flatMap(listing => listing.amenityNames.map(name => name.trim()))
        .filter(Boolean)
    )
  ).map(name => ({ name })),
} as const;

export function isE2ERun() {
  const env = process.env.NEXT_PUBLIC_E2E ?? process.env.E2E ?? '';
  return ['1', 'true', 'yes'].includes(String(env).toLowerCase());
}

const normalize = (value: string) => value.trim().toLowerCase();

function matchesQuery(listing: E2EDiscoveryListing, query: string) {
  if (!query) return true;
  const normalized = normalize(query);
  const haystack = [
    listing.name,
    listing.slug,
    listing.category,
    listing.city.name,
    listing.city.country,
    listing.shortDescription ?? '',
  ];
  return haystack.some(value => normalize(value).includes(normalized));
}

function matchesAny(valueList: readonly string[], selections: readonly string[]) {
  if (!selections.length) return true;
  const normalizedValues = valueList.map(normalize);
  return selections.some(selection => normalizedValues.includes(normalize(selection)));
}

function matchesAll(valueList: readonly string[], selections: readonly string[]) {
  if (!selections.length) return true;
  const normalizedValues = valueList.map(normalize);
  return selections.every(selection => normalizedValues.includes(normalize(selection)));
}

function toApiResult(listing: E2EDiscoveryListing) {
  return {
    _id: listing._id,
    name: listing.name,
    slug: listing.slug,
    category: listing.category,
    city: {
      _id: listing.city._id,
      name: listing.city.name,
      slug: listing.city.slug,
      country: listing.city.country,
    },
    primaryImage: listing.primaryImageUrl ? { asset: { url: listing.primaryImageUrl } } : null,
    shortDescription: listing.shortDescription,
    amenityNames: listing.amenityNames,
    ecoFocusTags: listing.ecoFocusTags,
    ecoFeatures: listing.ecoFocusTags,
    moderation: listing.featured ? { featured: true } : undefined,
  };
}

function toListingSummary(listing: E2EDiscoveryListing): ListingSummaryDTO {
  return {
    id: listing._id,
    name: listing.name,
    slug: listing.slug,
    type: listing.category,
    city: {
      id: listing.city._id,
      name: listing.city.name,
      slug: listing.city.slug,
      country: listing.city.country,
    },
    imageUrl: listing.primaryImageUrl,
    shortDescription: listing.shortDescription,
    amenityNames: [...listing.amenityNames],
    ecoFocusTags: [...listing.ecoFocusTags],
    digitalNomadFeatures: listing.digitalNomadFeatures
      ? [...listing.digitalNomadFeatures]
      : undefined,
    location: listing.location
      ? { lat: listing.location.lat, lng: listing.location.lng }
      : undefined,
    priceRange: listing.priceRange,
    featured: listing.featured,
    address: listing.address,
  };
}

function computeFacets(listings: readonly E2EDiscoveryListing[]): FacetBuckets {
  const categoryCounts = new Map<string, number>();
  const destinationCounts = new Map<string, number>();
  const amenityCounts = new Map<string, number>();

  const increment = (map: Map<string, number>, rawValue?: string) => {
    if (!rawValue) return;
    const key = rawValue.trim();
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + 1);
  };

  for (const listing of listings) {
    increment(categoryCounts, listing.category);
    increment(destinationCounts, listing.city.name);
    for (const amenity of listing.amenityNames) {
      increment(amenityCounts, amenity);
    }
  }

  const mapToArray = (map: Map<string, number>) =>
    Array.from(map.entries(), ([value, count]) => ({ value, count }));

  return {
    category: mapToArray(categoryCounts),
    destination: mapToArray(destinationCounts),
    amenities: mapToArray(amenityCounts),
  };
}

export function buildE2ESearchResponse({
  q,
  categories,
  destinations,
  amenities,
  nomadFeatures,
  page,
  limit,
  includeFacets,
}: SearchComputationParams): SearchComputationResult {
  const filtered = discoveryListings.filter(listing => {
    if (!matchesQuery(listing, q)) return false;
    if (!matchesAny([listing.category], categories)) return false;
    if (!matchesAny([listing.city.name, listing.city.slug], destinations)) return false;
    if (!matchesAll(listing.amenityNames, amenities)) return false;
    if (!matchesAll(listing.digitalNomadFeatures ?? [], nomadFeatures)) return false;
    return true;
  });

  const total = filtered.length;
  const normalizedLimit = Math.max(1, limit);
  const normalizedPage = Math.max(1, page);
  const start = (normalizedPage - 1) * normalizedLimit;
  const end = start + normalizedLimit;
  const slice = filtered.slice(start, end);

  const pagination = {
    page: normalizedPage,
    limit: normalizedLimit,
    total,
    totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
    hasMore: normalizedPage * normalizedLimit < total,
  };

  return {
    results: slice.map(toApiResult),
    pagination,
    ...(includeFacets ? { facets: computeFacets(filtered) } : {}),
    filters: {
      query: q,
      category: categories,
      destination: destinations,
      amenities,
      nomadFeatures,
    },
  };
}

export function getE2ECitySummary(slug: string): CityDTO | null {
  const detail = discoveryCities.find(city => city.slug === slug);
  if (!detail) return null;
  const {
    galleryImages: _ignored_gallery,
    digitalNomadFeatures: _ignored_dn,
    sustainabilityInitiatives: _ignored_si,
    shortDescription: _ignored_sd,
    airQuality: _ignored_aq,
    internetSpeed: _ignored_is,
    costOfLiving: _ignored_cl,
    climate: _ignored_climate,
    safety: _ignored_safety,
    walkability: _ignored_walk,
    ...rest
  } = detail;
  return { ...rest };
}

export function getE2ECityDetail(slug: string): CityDetailDTO | null {
  const detail = discoveryCities.find(city => city.slug === slug);
  return detail ? { ...detail } : null;
}

export function getE2ECityList(limit = 20): CityDTO[] {
  return discoveryCities
    .slice(0, limit)
    .map(city => getE2ECitySummary(city.slug)!)
    .filter(Boolean);
}

export function getE2EListingsForCity(cityId: string): ListingSummaryDTO[] {
  return discoveryListings
    .filter(listing => listing.city._id === cityId)
    .map(listing => toListingSummary(listing));
}

export const e2eDiscoveryListings = discoveryListings;
export const e2eDiscoveryCities = discoveryCities;

export function parseSearchParamsForE2E(params: SearchParamRecord) {
  const normalizeParam = (value: string | string[] | undefined): string[] => {
    if (value === undefined) return [];
    return Array.isArray(value) ? value.map(String) : [String(value)];
  };

  const getFirst = (value: string | string[] | undefined): string => {
    if (value === undefined) return '';
    return Array.isArray(value) ? String(value[0] ?? '') : String(value);
  };

  return {
    q: getFirst(params.q),
    categories: normalizeParam(params.category),
    destinations: normalizeParam(params.destination),
    amenities: normalizeParam(params.amenities),
    nomadFeatures: normalizeParam(params.nomadFeatures),
  };
}
