import { NextRequest } from 'next/server';
import { groq } from 'next-sanity';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';

function parseArrayParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map(v => v.trim()).filter(v => v.length > 0);
}

function buildQuery({ q, categories, destinations, amenities, nomadFeatures, start, end }: {
  q: string;
  categories: string[];
  destinations: string[];
  amenities: string[];
  nomadFeatures: string[];
  start: number;
  end: number;
}) {
  const base = '*[_type == "listing" && defined(slug)]';
  const filters: string[] = [];

  if (q) {
    // Escape special characters that have meaning in GROQ
    const safe = q.replace(/[\\"*[\](){}|&!<>=~^$@#%]/g, '\\$&');
    filters.push(`name match "*${safe}*" || shortDescription match "*${safe}*"`);
  }
  if (categories.length) {
    filters.push(categories.map(c => `category == "${c.replace(/["\\]/g, '\\$&')}"`).join(' || '));
  }
  if (destinations.length) {
    const parts: string[] = [];
    for (const d of destinations) {
      const escaped = d.replace(/["\\]/g, '\\$&');
      const matchEscaped = d.replace(/[\\"*[\](){}|&!<>=~^$@#%]/g, '\\$&');
      parts.push(`city->name == "${escaped}"`);
      parts.push(`city->name match "*${matchEscaped}*"`);
    }
    filters.push(parts.join(' || '));
  }
  if (amenities.length) {
    const parts: string[] = [];
    for (const a of amenities) {
      const escaped = a.replace(/["\\]/g, '\\$&');
      parts.push(`amenities[] == "${escaped}"`);
      // also match digital nomad features names
      parts.push(`array::contains(digitalNomadFeatures[]->name, "${escaped}")`);
    }
    filters.push(parts.join(' || '));
  }
  if (nomadFeatures.length) {
    filters.push(
      nomadFeatures
        .map(f => `array::contains(digitalNomadFeatures[]->name, "${f.replace(/["\\]/g, '\\$&')}")`)
        .join(' || ')
    );
  }

  const where = filters.length ? `${base}[${filters.join(' && ')}]` : base;

  const fields = `{
    _id,
    name,
    slug,
    category,
    primaryImage,
    galleryImages,
    location,
    priceRange,
    moderation,
    shortDescription,
    longDescription,
    ecoFeatures,
    amenities
  }`;

  const query = `${where} | order(_createdAt desc)[${start}...${end}] ${fields}`;
  const countQuery = `count(${where})`;

  return { query, countQuery };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Number(searchParams.get('limit') || 12));

    const categories = parseArrayParam(searchParams.getAll('category'));
    const destinations = parseArrayParam(searchParams.getAll('destination'));
    const amenities = parseArrayParam(searchParams.getAll('amenities'));
    const nomadFeatures = parseArrayParam(searchParams.getAll('nomadFeatures'));

    const start = (page - 1) * limit;
    const end = start + limit;

    const { query, countQuery } = buildQuery({ q, categories, destinations, amenities, nomadFeatures, start, end });

    const combinedQuery = groq`{
      "results": ${query},
      "total": ${countQuery}
    }`;
    const { results, total } = await client.fetch(combinedQuery);

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
      return ApiResponseHandler.error('Invalid JSON in request body', 400);
    }

    const q = (body.query || '').trim();
    const page = Math.max(1, Number(body.page || 1));
    const limit = Math.max(1, Number(body.limit || 12));

    const categories = parseArrayParam(body.category);
    const destinations = parseArrayParam(body.destination);
    const amenities = parseArrayParam(body.amenities);
    const nomadFeatures = parseArrayParam(body.nomadFeatures);

    const start = (page - 1) * limit;
    const end = start + limit;

    const { query, countQuery } = buildQuery({ q, categories, destinations, amenities, nomadFeatures, start, end });

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
