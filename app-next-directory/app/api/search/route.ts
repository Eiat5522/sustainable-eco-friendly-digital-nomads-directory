/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { groq } from 'next-sanity';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { sanitizeBasic, sanitizeStringArray, escapeGroqLiteral, escapeGroqMatch, clampInt } from '@/utils/sanitize';

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

  const filters: string[] = ['_type == "listing"', 'moderation.status == "published"'];

  if (q) {
    const pattern = escapeGroqMatch(q.toLowerCase());
    filters.push(
      `name match "*${pattern}*" || lower(name) match "*${pattern}*" || slug match "*${pattern}*" || category match "*${pattern}*" || lower(category) match "*${pattern}*" || city->name match "*${pattern}*" || lower(city->name) match "*${pattern}*" || city->country match "*${pattern}*" || lower(city->country) match "*${pattern}*" || shortDescription match "*${pattern}*" || lower(shortDescription) match "*${pattern}*"`
    );
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
    const eq = amenities
      .map((a) => `amenities[] == "${escapeGroqLiteral(a)}"`)
      .join(' || ');
    const nfs = amenities
      .map((a) => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(a)}")`)
      .join(' || ');
    filters.push(`(${eq})`);
    filters.push(`(${nfs})`);
  }

  if (nomadFeatures.length) {
    const nfs = nomadFeatures
      .map((nf) => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(nf)}")`)
      .join(' || ');
    filters.push(`(${nfs})`);
  }

  return filters.join(' && ');
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
}) {
  const where = buildWhereClause({ q, categories, destinations, amenities, nomadFeatures });

  const fields = `{
    _id,
    name,
    "slug": slug,
    category,
    "primaryImage": primaryImage{..., asset->},
    "galleryImages": galleryImages[]{..., asset->},
    "location": city->{ _id, name, "slug": slug.current, country },
    priceRange,
    moderation,
    shortDescription,
    longDescription,
    ecoFeatures,
    amenities
  }`;

  const query = `* [${where}] | order(_createdAt desc)[${start}...${end}] ${fields}`.replace('* [', '*[');
  const countQuery = `count(*[${where}])`;
  return { query, countQuery };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = sanitizeBasic(searchParams.get('q') || '');
    const page = clampInt(Number.parseInt(searchParams.get('page') ?? '1', 10) || 1, { min: 1, max: 100000 });
    const limit = clampInt(Number.parseInt(searchParams.get('limit') ?? '12', 10) || 12, { min: 1, max: 100 });

    const categories = sanitizeStringArray(searchParams.getAll('category'));
    const destinations = sanitizeStringArray(searchParams.getAll('destination'));
    const amenities = sanitizeStringArray(searchParams.getAll('amenities'));
    const nomadFeatures = sanitizeStringArray(searchParams.getAll('nomadFeatures'));

    const start = (page - 1) * limit;
    const end = start + limit; // GROQ [start...end] uses exclusive end with "..."

    const { query, countQuery } = buildQuery({
      q,
      categories,
      destinations,
      amenities,
      nomadFeatures,
      start,
      end,
    });

    // Fetch results and total in two separate calls to align with tests
    const results = await client.fetch(query);
    const total = await client.fetch(countQuery);

    return ApiResponseHandler.success({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        hasMore: page * limit < total,
      },
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
    return ApiResponseHandler.error('Search failed');
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

    const categories = sanitizeStringArray(body.category);
    const destinations = sanitizeStringArray(body.destination);
    const amenities = sanitizeStringArray(body.amenities);
    const nomadFeatures = sanitizeStringArray(body.nomadFeatures);

    const start = (page - 1) * limit;
    const end = start + limit; // GROQ [start...end] is exclusive of end
    const { query, countQuery } = buildQuery({ q, categories, destinations, amenities, nomadFeatures, start, end });
    // Fetch results and total in two separate calls to align with tests
    const results = await client.fetch(query);
    const total = await client.fetch(countQuery);

    return ApiResponseHandler.success({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        hasMore: page * limit < total,
      },
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