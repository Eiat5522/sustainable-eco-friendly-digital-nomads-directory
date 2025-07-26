import { client } from '@/lib/sanity/client';
// Type that matches the actual GROQ query result
interface FeaturedListing {
  _id: string;
  name: string;
  slug: string;
  primaryImage?: {
    alt?: string;
    asset?: {
      _id?: string;
      url?: string;
      metadata?: {
        dimensions?: any;
        lqip?: string;
      };
    };
  };
  galleryImages?: {
    alt?: string;
    asset?: {
      _id?: string;
      url?: string;
      metadata?: {
        dimensions?: any;
        lqip?: string;
      };
    };
  };
  location?: {
    _id?: string;
    name?: string;
    country?: string;
  };
  priceRange?: string | null;
}

import { groq } from 'next-sanity';
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = performance.now();
  console.log('[DEBUG] Featured Listings API: Request started at', new Date().toISOString());

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    console.error('[ERROR] Featured Listings API: Sanity environment variables are not configured.');
    return NextResponse.json({
      error: 'Server configuration error: Sanity credentials missing.',
      success: false,
      listings: []
    }, { status: 500 });
  }
  
  try {
    // Corrected GROQ query to match your schema
    const FEATURED_LISTINGS_QUERY = groq`*[_type == "listing" && moderation.featured == true && moderation.status == "published"] | order(_createdAt desc)[0...10] {
      _id,
      name,
      "slug": slug.current,
      "primaryImage": primaryImage{
        alt,
        "asset": asset->{
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        }
      },
      "galleryImages": galleryImages[0]{
        alt,
        "asset": asset->{
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        }
      },
      "location": city->{
        _id,
        name,
        country
      },
      "priceRange": coalesce(
        accommodationDetails.pricePerNightThbRange,
        cafeDetails.priceIndication,
        restaurantDetails.priceRange,
        string(activitiesDetails.pricePerPerson.min) + "-" + string(activitiesDetails.pricePerPerson.max)
      )
    }`;

    console.log('[DEBUG] Featured Listings API: Executing GROQ query');
    const queryStartTime = performance.now();
    
    const listings = await client.fetch<FeaturedListing[]>(FEATURED_LISTINGS_QUERY);
    
    const queryEndTime = performance.now();
    console.log('[DEBUG] Featured Listings API: GROQ query completed in', (queryEndTime - queryStartTime).toFixed(2), 'ms');
    console.log('[DEBUG] Featured Listings API: Found', listings.length, 'listings');
    
    // Log data structure for first listing if available
    if (listings.length > 0) {
      console.log('[DEBUG] Featured Listings API: Sample listing structure:', {
        hasId: !!listings[0]._id,
        hasName: !!listings[0].name,
        hasSlug: !!listings[0].slug,
        hasPrimaryImage: !!listings[0].primaryImage,
        hasPriceRange: !!listings[0].priceRange
      });
    }

    const endTime = performance.now();
    console.log('[DEBUG] Featured Listings API: Total request time', (endTime - startTime).toFixed(2), 'ms');

    return NextResponse.json({
      listings,
      success: true,
      metadata: {
        total: listings.length,
        query_time: new Date().toISOString(),
        performance: {
          total_time_ms: (endTime - startTime).toFixed(2),
          query_time_ms: (queryEndTime - queryStartTime).toFixed(2)
        }
      }
    });
  } catch (error) {
    const endTime = performance.now();
    console.error('[ERROR] Featured Listings API: Request failed after', (endTime - startTime).toFixed(2), 'ms');
    console.error('[ERROR] Featured Listings API:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch listings',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      performance: {
        total_time_ms: (endTime - startTime).toFixed(2)
      }
    }, { status: 500 });
  }
}
