import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { groq } from 'next-sanity';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.getAll('category');
    const destination = searchParams.getAll('destination');
    const features_amenities = searchParams.getAll('features_amenities');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build the GROQ query for Sanity
    let groqQuery = `*[_type == "listing" && moderation.status == "published"`;
    
    // Add search conditions with case-insensitive matching
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      // Enhanced search across multiple fields using GROQ with case-insensitive matching
      groqQuery += ` && (
        name match "*${searchTerm}*" ||
        lower(name) match "*${searchTerm}*" ||
        slug.current match "*${searchTerm}*" ||
        category match "*${searchTerm}*" ||
        lower(category) match "*${searchTerm}*" ||
        city->name match "*${searchTerm}*" ||
        lower(city->name) match "*${searchTerm}*" ||
        city->country match "*${searchTerm}*" ||
        lower(city->country) match "*${searchTerm}*" ||
        description_short match "*${searchTerm}*" ||
        lower(description_short) match "*${searchTerm}*"
      )`;
    }
    if (category && category.length > 0) {
      groqQuery += ` && (${category.map((cat) => `category == "${cat}"`).join(' || ')})`;
    }
    if (destination && destination.length > 0) {
      groqQuery += ` && (${destination.map((loc) => `city->name match "*${loc}*"`).join(' || ')})`;
    }
    if (features_amenities && features_amenities.length > 0) {
      groqQuery += ` && (${features_amenities.map((fa) => `array::contains(eco_features, "${fa}") || array::contains(amenities, "${fa}")`).join(' || ')})`;
    }

    groqQuery += `] | order(_createdAt desc)`;

    // Add pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    groqQuery += `[${start}...${end}]`;

    // Add fields to select
    groqQuery += ` {
      _id,
      name,
      "slug": slug.current,
      category,
      "primaryImage": primaryImage{
        ...,
        asset->
      },
      "galleryImages": galleryImages[]{
        ...,
        asset->
      },
      "location": city->{
        _id,
        name,
        country
      },
      price,
      moderation,
      description_short,
      description_long,
      eco_features,
      amenities
    }`;

    // Get the results
    const results = await client.fetch(groqQuery);

    // Get total count for pagination (separate query without pagination)
    let countQuery = `count(*[_type == "listing" && moderation.status == "published"`;
    
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      countQuery += ` && (
        name match "*${searchTerm}*" ||
        lower(name) match "*${searchTerm}*" ||
        slug.current match "*${searchTerm}*" ||
        category match "*${searchTerm}*" ||
        lower(category) match "*${searchTerm}*" ||
        city->name match "*${searchTerm}*" ||
        lower(city->name) match "*${searchTerm}*" ||
        city->country match "*${searchTerm}*" ||
        lower(city->country) match "*${searchTerm}*" ||
        description_short match "*${searchTerm}*" ||
        lower(description_short) match "*${searchTerm}*"
      )`;
    }
    if (category && category.length > 0) {
      countQuery += ` && (${category.map((cat) => `category == "${cat}"`).join(' || ')})`;
    }
    if (destination && destination.length > 0) {
      countQuery += ` && (${destination.map((loc) => `city->name match "*${loc}*"`).join(' || ')})`;
    }
    if (features_amenities && features_amenities.length > 0) {
      countQuery += ` && (${features_amenities.map((fa) => `array::contains(eco_features, "${fa}") || array::contains(amenities, "${fa}")`).join(' || ')})`;
    }

    countQuery += `])`;

    const total = await client.fetch(countQuery);

    return ApiResponseHandler.success({
      results: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      filters: {
        query,
        category,
        destination
      }
    });
  } catch (error) {
    console.error('Search GET error:', error);
    return ApiResponseHandler.error('Search failed');
  }
}

export async function POST(request: Request) {
  try {
    // For backward compatibility, redirect POST requests to use the same logic as GET
    const body = await request.json();
    const { query = '', page = 1, limit = 12 } = body;
    
    // Create a URL with search params to reuse the GET logic
    const url = new URL('http://localhost:3000/api/search');
    url.searchParams.set('q', query);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('limit', limit.toString());
    
    const mockRequest = new NextRequest(url);
    return await GET(mockRequest);
  } catch (error) {
    console.error('Search POST error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
