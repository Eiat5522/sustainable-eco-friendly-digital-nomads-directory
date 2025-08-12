import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { NextRequest, NextResponse } from 'next/server';

import { ApiResponseHandler } from '@/utils/api-response';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.getAll('category');
    const destination = searchParams.getAll('destination');
    const nomadFeatures = searchParams.getAll('nomadFeatures');
    const page = Math.max(1, Number(parseInt(searchParams.get('page') ?? '1', 10)));
    const limit = Math.max(1, Number(parseInt(searchParams.get('limit') ?? '10', 10)));

    // Build the GROQ query for Sanity
    let groqQuery = `*[_type == "listing" && moderation.status == "published"`;
    
    // Add search conditions with case-insensitive matching
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      // Enhanced search across multiple fields using GROQ with case-insensitive matching
      groqQuery += ` && (
        name match "*${searchTerm}*" ||
        lower(name) match "*${searchTerm}*" ||
        slug match "*${searchTerm}*" ||
        category match "*${searchTerm}*" ||
        lower(category) match "*${searchTerm}*" ||
        city->name match "*${searchTerm}*" ||
        lower(city->name) match "*${searchTerm}*" ||
        city->country match "*${searchTerm}*" ||
        lower(city->country) match "*${searchTerm}*" ||
        shortDescription match "*${searchTerm}*" ||
        lower(shortDescription) match "*${searchTerm}*"
      )`;
    }
    if (category && category.length > 0) {
      groqQuery += ` && (${category.map((cat) => `category == "${cat}"`).join(' || ')})`;
    }
    if (destination && destination.length > 0) {
      groqQuery += ` && (${destination.map((loc) => `city->name match "*${loc}*"`).join(' || ')})`;
    }
    if (nomadFeatures && nomadFeatures.length > 0) {
      groqQuery += ` && (${nomadFeatures.map((nf) => `array::contains(digitalNomadFeatures[]->name, "${nf}")`).join(' || ')})`;
    }

    groqQuery += `] | order(_createdAt desc)`;

    // Add pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    groqQuery += `[${start}...${end}]`; // inclusive end per GROQ slice


    // Add fields to select
    groqQuery += ` {
      _id,
      name,
      "slug": slug,
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
        "slug": slug.current,
        country
      },
      priceRange,
      moderation,
      shortDescription,
      longDescription,
      ecoFeatures,
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
        slug match "*${searchTerm}*" ||
        category match "*${searchTerm}*" ||
        lower(category) match "*${searchTerm}*" ||
        city->name match "*${searchTerm}*" ||
        lower(city->name) match "*${searchTerm}*" ||
        city->country match "*${searchTerm}*" ||
        lower(city->country) match "*${searchTerm}*" ||
        shortDescription match "*${searchTerm}*" ||
        lower(shortDescription) match "*${searchTerm}*"
      )`;
    }
    if (category && category.length > 0) {
      countQuery += ` && (${category.map((cat) => `category == "${cat}"`).join(' || ')})`;
    }
    if (destination && destination.length > 0) {
      countQuery += ` && (${destination.map((loc) => `city->name match "*${loc}*"`).join(' || ')})`;
    }
    if (nomadFeatures && nomadFeatures.length > 0) {
      countQuery += ` && (${nomadFeatures.map((nf) => `array::contains(digitalNomadFeatures[]->name, "${nf}")`).join(' || ')})`;
    }

    countQuery += `])`;

    const total = await client.fetch(countQuery);

    // ApiResponseHandler is already available from static import
    return ApiResponseHandler.success({
    // ApiResponseHandler is already available from static import        page,
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
    const { ApiResponseHandler } = await apiResponseModulePromise;
    return ApiResponseHandler.error('Search failed'); // tests assert generic message only
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
const { query = '', page: rawPage = '1', limit: rawLimit = '12' } = body ?? {};
const page  = Number(parseInt(rawPage as string, 10))  || 1;
const limit = Number(parseInt(rawLimit as string, 10)) || 12;

    let groqQuery = `*[_type == "listing" && moderation.status == "published"`;

    if (String(query).trim()) {
      const searchTerm = String(query).toLowerCase();
      groqQuery += ` && (
        name match "*${searchTerm}*" ||
        lower(name) match "*${searchTerm}*" ||
        slug match "*${searchTerm}*" ||
        category match "*${searchTerm}*" ||
        lower(category) match "*${searchTerm}*" ||
        city->name match "*${searchTerm}*" ||
        lower(city->name) match "*${searchTerm}*" ||
        city->country match "*${searchTerm}*" ||
        lower(city->country) match "*${searchTerm}*" ||
        shortDescription match "*${searchTerm}*" ||
        lower(shortDescription) match "*${searchTerm}*"
      )`;
    }

    groqQuery += `] | order(_createdAt desc)`;

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    groqQuery += `[${start}...${end}]`;

    groqQuery += ` {
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

    const results = await client.fetch(groqQuery);

    let countQuery = `count(*[_type == "listing" && moderation.status == "published"`;
    if (String(query).trim()) {
      const searchTerm = String(query).toLowerCase();
      countQuery += ` && (
        name match "*${searchTerm}*" ||
        lower(name) match "*${searchTerm}*" ||
        slug match "*${searchTerm}*" ||
        category match "*${searchTerm}*" ||
        lower(category) match "*${searchTerm}*" ||
        city->name match "*${searchTerm}*" ||
        lower(city->name) match "*${searchTerm}*" ||
        city->country match "*${searchTerm}*" ||
        lower(city->country) match "*${searchTerm}*" ||
        shortDescription match "*${searchTerm}*" ||
        lower(shortDescription) match "*${searchTerm}*"
      )`;
    }
    countQuery += `])`;

    const total = await client.fetch(countQuery);

    const { ApiResponseHandler } = await apiResponseModulePromise;
    return ApiResponseHandler.success({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: results.length === limit && (page * limit) < total,
      },
      filters: {
        query,
       filters: {
         query,
         category: body?.category ? (Array.isArray(body.category) ? body.category : [body.category]) : [],
         destination: body?.destination ? (Array.isArray(body.destination) ? body.destination : [body.destination]) : []
       },
    });  } catch (error) {
    console.error('Search POST error:', error);
    const { ApiResponseHandler } = await apiResponseModulePromise;
    return ApiResponseHandler.error('Failed to perform search');
  }
}
