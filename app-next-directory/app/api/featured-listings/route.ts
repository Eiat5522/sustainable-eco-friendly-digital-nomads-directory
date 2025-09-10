// PATCH: Align GROQ query and DTO mapping with appView.ts
import { client } from '@/lib/sanity/client';
import type { AppListingCard, AppListingDetail, AppCity, SanityImage } from '@/types/appView';
interface FeaturedListing {
  _id: string;
  name: string;
  slug: string;
  city?: {
    _id?: string;
    name?: string;
    slug?: string;
    country?: string;
  };
  ecoFocusTags?: string[];
  digitalNomadFeatures?: string[];
  amenities?: Array<{
    _id: string;
    name: string;
    description?: string;
    badge?: SanityImage;
  }>;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  priceRange?: string;
  type?: string;
  shortDescription?: string;
  address?: string;
  category?: string;
  location?: { lat: number; lng: number };
  primaryImage?: SanityImage;
  galleryImages?: SanityImage[];
  imageUrl?: string | null;
  coworkingDetails?: {
    capacity?: number;
    pricingPlans?: Array<{ type: string; price: number; period: string }>;
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  };
  accommodationDetails?: {
    pricePerNightThb?: { min?: number; max?: number };
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  };
  cafeDetails?: {
    openingHours?: Array<{ day: string; opens: string; closes: string }>;
  };
}

import { groq } from 'next-sanity';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  const startTime = performance.now();
  console.log('[DEBUG] Featured Listings API: Request started at', new Date().toISOString());

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    console.error('[ERROR] Featured Listings API: Sanity environment variables are not configured.');
    return ApiResponseHandler.error('Server configuration error: Sanity credentials missing.', 500);
  }
  
  try {
    // Corrected GROQ query to match your schema and DTO
    const FEATURED_LISTINGS_QUERY = groq`*[_type == "listing" && moderation.featured == true && moderation.status == "published"] | order(_createdAt desc)[0...10] {
      _id,
      name,
      "slug": slug.current,
      "city": city->{ _id, name, "slug": slug.current, country },
      "ecoFocusTags": ecoFocusTags[]->name,
            "digitalNomadFeatures": digitalNomadFeatures[]->name,
      "amenities": amenities[]-> {
        _id,
        name,
        description,
        badge{
          asset->{
            _id,
            url,
            metadata {
              dimensions,
              lqip
            }
          }
        }
      },
      primaryImage,
      galleryImages,
      contactPhone,
      contactEmail,
      website,
      priceRange,
      type,
      shortDescription,
      address,
      category,
      location,
      primaryImage{
        alt,
        asset->{
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        }
      },
      galleryImages[] {
        alt,
        asset->{
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        }
      },
      "imageUrl": primaryImage.asset->url,
      coworkingDetails{
        capacity,
        pricingPlans[] { type, price, period },
        openingHours[] { day, opens, closes }
      },
      accommodationDetails{
        pricePerNightThb { min, max },
        openingHours[] { day, opens, closes }
      },
      cafeDetails{
        openingHours[] { day, opens, closes }
      }
    }`;
    console.log('[DEBUG] Featured Listings API: Executing GROQ query');
    const queryStartTime = performance.now();
    
    const listings = await client.fetch(FEATURED_LISTINGS_QUERY) as FeaturedListing[];
    
    const queryEndTime = performance.now();
    console.log('[DEBUG] Featured Listings API: GROQ query completed in', (queryEndTime - queryStartTime).toFixed(2), 'ms');
    console.log('[DEBUG] Featured Listings API: Found', listings.length, 'listings');
    
    // Transform to FeaturedListingDTO shape expected by the frontend
    const dtoListings = listings.map(listing => ({
      id: listing._id,
      name: listing.name,
      slug: listing.slug || '',
      imageUrl: listing.imageUrl || undefined,
      city: listing.city?.name || '',
      amenityNames: Array.isArray(listing.amenities)
        ? listing.amenities.map(a => a?.name).filter(Boolean)
        : [],
    }));

    const endTime = performance.now();
    console.log('[DEBUG] Featured Listings API: Total request time', (endTime - startTime).toFixed(2), 'ms');

    return ApiResponseHandler.success({ listings: dtoListings });
  } catch (error) {
    const endTime = performance.now();
    console.error('[ERROR] Featured Listings API: Request failed after', (endTime - startTime).toFixed(2), 'ms');
    console.error('[ERROR] Featured Listings API:', error);
    
    return ApiResponseHandler.error('Failed to fetch listings', 500, {
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      performance: {
        totalTimeMs: (endTime - startTime).toFixed(2)
      }
    });
  }
}
