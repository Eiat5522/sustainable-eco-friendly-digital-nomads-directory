

// PATCH: Align GROQ query and DTO mapping with appView.ts
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { SanityImage } from '@/types/appView';

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
import { mockFeaturedVenues } from '@/components/sections/featuredVenuesMockData';
import { isSanityConfigured } from '@/lib/sanity/env';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  const startTime = performance.now();
  const requestStartTimestamp = new Date().toISOString();
  structuredLogger.info('Featured listings request started', {
    component: 'api/featured-listings',
    startedAt: requestStartTimestamp,
  });

  if (process.env.NEXT_PUBLIC_MOCK_SANITY_DATA === 'true') {
    structuredLogger.info('Using mock featured listings data as NEXT_PUBLIC_MOCK_SANITY_DATA is true', {
      component: 'api/featured-listings',
    });
    return ApiResponseHandler.success({ listings: mockFeaturedVenues });
  }

  if (!isSanityConfigured()) {
    return ApiResponseHandler.success({ listings: mockFeaturedVenues });
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
    structuredLogger.debug('Executing featured listings GROQ query', {
      component: 'api/featured-listings',
    });
    const queryStartTime = performance.now();

    // Protect prerender from hanging/aborted network requests by adding
    // a timeout and handling rejected fetches so Next's prerenderer doesn't
    // surface a hanging-promise rejection. We intentionally keep a short
    // timeout to fail fast during static generation and fall back to
    // mock data where appropriate.
    const FETCH_TIMEOUT_MS = 10_000;

    // Start the fetch and attach a catcher to avoid unhandled rejections
    // in case the request is aborted after prerender completes.
    const rawFetch = client.fetch<FeaturedListing[]>(FEATURED_LISTINGS_QUERY).catch(
      _err => {
        // Return null on error; we'll handle logging and fallback below.
        return null as unknown as FeaturedListing[] | null;
      }
    );

    const timeoutPromise = new Promise<null>(resolve =>
      setTimeout(() => resolve(null), FETCH_TIMEOUT_MS)
    );

    const fetchResult = (await Promise.race([rawFetch, timeoutPromise])) as
      | FeaturedListing[]
      | null;

    if (fetchResult === null) {
      // Timed out or errored; log and fall back to empty/mocked listings so
      // prerender can continue without surfacing the underlying network error.
      structuredLogger.warn('Featured listings fetch timed out or failed; using fallback', {
        component: 'api/featured-listings',
        timeoutMs: FETCH_TIMEOUT_MS,
      });
    }

    // FORTEST: guard for prerender - ensure listings is an array
    const safeListings = Array.isArray(fetchResult) ? fetchResult : [];
    const queryEndTime = performance.now();
    structuredLogger.info('Featured listings query completed', {
      component: 'api/featured-listings',
      durationMs: Number((queryEndTime - queryStartTime).toFixed(2)),
      listingCount: safeListings.length,
    });

    // Transform to FeaturedListingDTO shape expected by the frontend
    const dtoListings = safeListings.map(listing => {
      const amenityNames = Array.isArray(listing.amenities)
        ? listing.amenities
            .map(amenity => (amenity && typeof amenity.name === 'string' ? amenity.name : null))
            .filter((name): name is string => typeof name === 'string' && name.length > 0)
        : [];
      const ecoFocusTags = Array.isArray(listing.ecoFocusTags)
        ? listing.ecoFocusTags.filter(
            (tag): tag is string => typeof tag === 'string' && tag.length > 0
          )
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

    const endTime = performance.now();
    structuredLogger.info('Featured listings request completed', {
      component: 'api/featured-listings',
      totalDurationMs: Number((endTime - startTime).toFixed(2)),
      startedAt: requestStartTimestamp,
    });

    const response = ApiResponseHandler.success({ listings: dtoListings });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    const endTime = performance.now();

    structuredLogger.error('Failed to fetch featured listings', error, {
      component: 'api/featured-listings',
      totalDurationMs: Number((endTime - startTime).toFixed(2)),
      startedAt: requestStartTimestamp,
    });

    const response = ApiResponseHandler.error('Failed to fetch listings', 500, {
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      performance: {
        totalTimeMs: (endTime - startTime).toFixed(2),
      },
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
}
