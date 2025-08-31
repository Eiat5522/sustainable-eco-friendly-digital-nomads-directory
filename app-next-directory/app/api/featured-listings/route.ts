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
    
    // Transform listings to DTO shape
    const dtoListings = listings.map(listing => ({
      id: listing._id,
      name: listing.name,
      slug: listing.slug || '',
      city: listing.city
        ? {
            id: listing.city._id || '',
            name: listing.city.name || '',
            slug: listing.city.slug || '',
            country: listing.city.country || ''
          }
        : null,
      cityName: listing.city?.name || '',
      ecoFocusTags: Array.isArray(listing.ecoFocusTags) ? listing.ecoFocusTags : [],
      digitalNomadFeatures: Array.isArray(listing.digitalNomadFeatures) ? listing.digitalNomadFeatures : [],
      amenities: Array.isArray(listing.amenities) ? listing.amenities.map(amenity => ({
        ...amenity,
        badge: amenity.badge || undefined
      })) : [],
      priceRange: listing.priceRange || undefined,
      website: listing.website || null,
      imageUrl: listing.imageUrl || null,
      primaryImage: listing.primaryImage || null,
      galleryImages: listing.galleryImages || [],
      contactPhone: listing.contactPhone || null,
      contactEmail: listing.contactEmail || null,
      coworkingDetails: listing.coworkingDetails || null,
      accommodationDetails: listing.accommodationDetails || null,
      cafeDetails: listing.cafeDetails || null,
      type: listing.type || undefined,
      shortDescription: listing.shortDescription || undefined,
      address: listing.address || undefined,
      category: listing.category || undefined,
      location: listing.location || undefined
    }));

    const endTime = performance.now();
    console.log('[DEBUG] Featured Listings API: Total request time', (endTime - startTime).toFixed(2), 'ms');

    return NextResponse.json({
      listings: dtoListings,
      success: true,
      metadata: {
        total: dtoListings.length,
        queryTime: new Date().toISOString(),
        performance: {
          totalTimeMs: (endTime - startTime).toFixed(2),
          queryTimeMs: (queryEndTime - queryStartTime).toFixed(2)
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
        totalTimeMs: (endTime - startTime).toFixed(2)
      }
    }, { status: 500 });
  }
}