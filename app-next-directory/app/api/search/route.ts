/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { groq } from 'next-sanity';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { sanitizeBasic, sanitizeStringArray, escapeGroqLiteral, escapeGroqMatch, clampInt } from '@/utils/sanitize';

// Fields selected for listing documents in GROQ queries
const LISTING_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  category,
  "primaryImage": primaryImage{..., asset->},
  "galleryImages": galleryImages[]{..., asset->},
  // Keep legacy location alias for compatibility, but also include city
  "location": city->{ _id, name, "slug": slug.current, country },
  "city": city->{ _id, name, "slug": slug.current, country },
  priceRange,
  moderation,
  shortDescription,
  longDescription,
  ecoFeatures,
  // Provide dereferenced amenity names for UI aggregation
  "amenityNames": amenities[]->name
`;

function buildWhereClause({
  q,
  categories,
  destinations,
  amenities,
  nomadFeatures,
}: {
  q: string;
  categories: string[];
  destinations: string[];
  amenities: string[];
  nomadFeatures: string[];
}): string {
  // Validate inputs to prevent overly complex queries (DoS)
  const MAX_ARRAY_SIZE = 50;
  const MAX_STRING_LENGTH = 200;

  if (
    categories.length > MAX_ARRAY_SIZE ||
    destinations.length > MAX_ARRAY_SIZE ||
    amenities.length > MAX_ARRAY_SIZE ||
    nomadFeatures.length > MAX_ARRAY_SIZE
  ) {
    throw new Error('Too many filter values provided');
  }

  if (q.length > MAX_STRING_LENGTH) {
    throw new Error('Search query too long');
  }

  // Only include published listings. Support legacy root-level `status` by coalescing.
  const filters: string[] = [
    '_type == "listing"',
    'coalesce(moderation.status, status) == "published"'
  ];

  if (q) {
    const pattern = escapeGroqMatch(q.toLowerCase());
    filters.push('(' + [
      `lower(name) match "*${pattern}*"`,
      `lower(coalesce(slug.current, slug)) match "*${pattern}*"`,
      `lower(category) match "*${pattern}*"`,
      `lower(city->name) match "*${pattern}*"`,
      `lower(city->country) match "*${pattern}*"`,
      `lower(shortDescription) match "*${pattern}*"`
    ].join(' || ') + ')');
  }
  if (categories.length) {
    const group = categories
      .map((c) => `category == "${escapeGroqLiteral(c)}"`)
      .join(' || ');
    filters.push(`(${group})`);
  }

  if (destinations.length) {
    const eq = destinations
      .map((d) => `city->name == "${escapeGroqLiteral(d)}"`)
      .join(' || ');
    const match = destinations
      .map((d) => `city->name match "*${escapeGroqMatch(d)}*"`)
      .join(' || ');
    filters.push(`((${eq}) || (${match}))`);
  }

  if (amenities.length) {
    // Support both legacy string comparison and name membership for referenced amenities
    const legacyEq = amenities
      .map((a) => `amenities[] == "${escapeGroqLiteral(a)}"`)
      .join(' || ');
    const amenityNameIn = amenities
      .map((a) => `("${escapeGroqLiteral(a)}" in amenities[]->name)`) // membership check in array of names
      .join(' || ');
    // Also match digital nomad feature names by the same terms for broader compatibility
    const dnFeatureNameIn = amenities
      .map((a) => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(a)}")`)
      .join(' || ');
    filters.push(`((${legacyEq}) || (${amenityNameIn}) || (${dnFeatureNameIn}))`);
  }
  if (nomadFeatures.length) {
    const nfs = nomadFeatures
      .map((nf) => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(nf)}")`)
      .join(' || ');
    filters.push(`(${nfs})`);
  }

  return filters.join(' && ');
}

type FacetSourceRecord = {
  category?: string | null;
  destination?: string | null;
  amenities?: Array<string | null> | null;
};

type FacetBuckets = {
  category: Array<{ value: string; count: number }>;
  destination: Array<{ value: string; count: number }>;
  amenities: Array<{ value: string; count: number }>;
};

function buildFacetBuckets(source: FacetSourceRecord[]): FacetBuckets {
  const categoryCounts = new Map<string, number>();
  const destinationCounts = new Map<string, number>();
  const amenityCounts = new Map<string, number>();

  const increment = (map: Map<string, number>, rawValue?: string | null) => {
    if (typeof rawValue !== 'string') return;
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    map.set(trimmed, (map.get(trimmed) ?? 0) + 1);
  };

  for (const record of source) {
    increment(categoryCounts, record?.category);
    increment(destinationCounts, record?.destination);

    if (Array.isArray(record?.amenities)) {
      for (const amenity of record.amenities) {
        increment(amenityCounts, amenity);
      }
    }
  }

  const mapToArray = (map: Map<string, number>) => Array.from(map.entries(), ([value, count]) => ({ value, count }));

  return {
    category: mapToArray(categoryCounts),
    destination: mapToArray(destinationCounts),
    amenities: mapToArray(amenityCounts),
  };
}

function buildQuery({
  q,
  categories,
  destinations,
  amenities,
  nomadFeatures,
  start,
  end,
}: {
  q: string;
  categories: string[];
  destinations: string[];
  amenities: string[];
  nomadFeatures: string[];
  start: number;
  end: number;
}): { query: string; countQuery: string; facetQuery: string } {
  const where = buildWhereClause({ q, categories, destinations, amenities, nomadFeatures });

  const fields = `{${LISTING_FIELDS}}`;

  const query = `*[${where}] | order(_createdAt desc, _id desc)[${start}...${end}] ${fields}`;
  const countQuery = `count(*[${where}])`;
  // Fetch facet source data - counts are aggregated in server runtime due to GROQ limitations
  const facetQuery = `*[
    ${where}
  ]{
    "category": select(defined(category) => category),
    "destination": select(defined(city->name) => city->name),
    "amenities": amenities[]->name
  }`;
  return { query, countQuery, facetQuery };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = sanitizeBasic(searchParams.get('q') || '');
    const page = clampInt(Number.parseInt(searchParams.get('page') ?? '1', 10) || 1, { min: 1, max: 100000 });
    const limit = clampInt(Number.parseInt(searchParams.get('limit') ?? '12', 10) || 12, { min: 1, max: 100 });
    const includeFacets = ['1', 'true', 'yes'].includes(String(searchParams.get('facets') ?? '').toLowerCase());

    const categories = sanitizeStringArray(searchParams.getAll('category'));
    const destinations = sanitizeStringArray(searchParams.getAll('destination'));
    const amenities = sanitizeStringArray(searchParams.getAll('amenities'));
    const nomadFeatures = sanitizeStringArray(searchParams.getAll('nomadFeatures'));

  const start = (page - 1) * limit;
  // GROQ '..' is inclusive; fetch exactly `limit` items
  const end = start + limit - 1;
    const { query, countQuery, facetQuery } = buildQuery({
      q,
      categories,
      destinations,
      amenities,
      nomadFeatures,
      start,
      end,
    });

    // Fetch results and total concurrently; facets only if requested
    const promises: Array<Promise<any>> = [client.fetch(query), client.fetch(countQuery)];
    if (includeFacets) promises.push(client.fetch(facetQuery));
    const settled = await Promise.all(promises);
    const results = settled[0];
    const total = settled[1];
    const facetSource: FacetSourceRecord[] = includeFacets && Array.isArray(settled[2]) ? settled[2] : [];
    const facets = includeFacets ? buildFacetBuckets(facetSource) : undefined;

    return ApiResponseHandler.success({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        hasMore: page * limit < total,
      },
      ...(includeFacets ? { facets } : {}),
      filters: {
        query: q,
        category: categories,
        destination: destinations,
        amenities,
        nomadFeatures,
      },
    });
  } catch (error) {
    console.error('Search GET error:', error);
    // Return an error response to signal upstream callers/tests that the CMS fetch failed.
    return ApiResponseHandler.error('Search failed', 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      // Standardize error message and status as tests expect
      return ApiResponseHandler.error('Failed to perform search', 400);
    }

    const q = sanitizeBasic(String(body.query ?? ''));
    const page = clampInt(Number(body.page ?? 1), { min: 1, max: 100000 });
    const limit = clampInt(Number(body.limit ?? 12), { min: 1, max: 100 });
    const includeFacets = Boolean(body?.facets === true);

    const categories = sanitizeStringArray(body.category);
    const destinations = sanitizeStringArray(body.destination);
    const amenities = sanitizeStringArray(body.amenities);
    const nomadFeatures = sanitizeStringArray(body.nomadFeatures);

    const start = (page - 1) * limit;
    // GROQ '..' is inclusive; fetch exactly `limit` items
    const end = start + limit - 1;
    const { query, countQuery, facetQuery } = buildQuery({ q, categories, destinations, amenities, nomadFeatures, start, end });
    // Fetch results and total concurrently; facets only if requested
    const promises: Array<Promise<any>> = [client.fetch(query), client.fetch(countQuery)];
    if (includeFacets) promises.push(client.fetch(facetQuery));

    const settled = await Promise.all(promises); 
    const results = settled[0];
    const total = settled[1];
    const facetSource: FacetSourceRecord[] = includeFacets && Array.isArray(settled[2]) ? settled[2] : [];
    const facets = includeFacets ? buildFacetBuckets(facetSource) : undefined;

    return ApiResponseHandler.success({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        hasMore: page * limit < total,
      },
      ...(includeFacets ? { facets } : {}),
      filters: {
        query: q,
        category: categories,
        destination: destinations,
        amenities,
        nomadFeatures,
      },
    });
  } catch (error) {
    console.error('Search POST error:', error);
    return ApiResponseHandler.error('Failed to perform search');
  }
}
