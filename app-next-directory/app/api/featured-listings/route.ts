// PATCH: Align GROQ query and DTO mapping with appView.ts
import { client } from '@/lib/sanity/client';
import type { SanityImage } from '@/types/appView';
import { redis } from '@/lib/redis';
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
  
  const cacheKey = 'featured-listings';

  try {
    if (redis) {
      const cachedListings = await redis.get(cacheKey);
      if (cachedListings) {
        console.log('[DEBUG] Featured Listings API: Cache hit');
        const endTime = performance.now();
        console.log('[DEBUG] Featured Listings API: Total request time', (endTime - startTime).toFixed(2), 'ms');
        return ApiResponseHandler.success({ listings: JSON.parse(cachedListings) });
      }
    }

    console.log('[DEBUG] Featured Listings API: Cache miss, executing GROQ query');
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
    const queryStartTime = performance.now();
    
    const listings = await client.fetch<FeaturedListing[]>(FEATURED_LISTINGS_QUERY);
    
    const queryEndTime = performance.now();
    console.log('[DEBUG] Featured Listings API: GROQ query completed in', (queryEndTime - queryStartTime).toFixed(2), 'ms');
    console.log('[DEBUG] Featured Listings API: Found', listings.length, 'listings');
    
    // Transform to FeaturedListingDTO shape expected by the frontend
    const dtoListings = (listings ?? []).map((listing) => {
      const amenityNames = Array.isArray(listing.amenities)
        ? listing.amenities
            .map((amenity) => (amenity && typeof amenity.name === 'string' ? amenity.name : null))
            .filter((name): name is string => typeof name === 'string' && name.length > 0)
        : [];
      const ecoFocusTags = Array.isArray(listing.ecoFocusTags)
        ? listing.ecoFocusTags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
        : [];

      return {
        id: listing._id,
        name: listing.name,
        slug: listing.slug || '',
        imageUrl: listing.imageUrl || undefined,
        city: listing.city?.name || '',
        amenityNames,
        ecoFocusTags,
        featured: true,
      };
    });

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(dtoListings), 'EX', 3600); // Cache for 1 hour
      console.log('[DEBUG] Featured Listings API: Stored in cache');
    }

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
