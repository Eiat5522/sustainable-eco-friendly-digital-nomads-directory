import type {
  LISTING_BY_SLUG_QUERYResult,
  City,
  EcoTag
} from '../../../../sanity/sanity.types';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getListingData } from '@/lib/sanity/data';
import { urlFor } from '@/lib/sanity/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ListingDetail from '@/components/listings/ListingDetail';

/**
 * Type guard function to check if the query result city is valid
 * Based on the actual GROQ query structure in data.ts
 */
function isQueryResultCity(value: any): value is { 
  _id: string; 
  name: string; 
  slug: { current: string }; 
  country: string;
  listingCount: number;
} {
  return (
    value &&
    typeof value === 'object' &&
    '_id' in value && typeof value._id === 'string' &&
    'name' in value && typeof value.name === 'string' &&
    'slug' in value && value.slug && typeof value.slug === 'object' &&
    'current' in value.slug && typeof value.slug.current === 'string' &&
    'country' in value && typeof value.country === 'string' &&
    'listingCount' in value && typeof value.listingCount === 'number'
  );
}

/**
 * Type guard function to check if a value is a canonical Slug object
 */
function isCanonicalSlug(value: any): value is { current: string } {
  return (
    value &&
    typeof value === 'object' &&
    'current' in value &&
    typeof value.current === 'string'
  );
}

/**
 * Type guard function to check if a Geopoint has valid coordinates
 */
function isValidLocation(value: any): value is { lat: number; lng: number } {
  return (
    value &&
    typeof value === 'object' &&
    'lat' in value && typeof value.lat === 'number' &&
    'lng' in value && typeof value.lng === 'number'
  );
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing: LISTING_BY_SLUG_QUERYResult | null = await getListingData(slug);

  if (!listing || !listing.name) {
    return notFound();
  }

  let imageUrl = '/placeholder-city.jpg';
  if (listing.primaryImage) {
    const builtUrl = urlFor(listing.primaryImage)?.width(1200).height(800).url();
    if (builtUrl) {
      imageUrl = builtUrl;
    }
  }
  const imageAlt = listing.primaryImage?.alt || listing.name || 'Listing image';

  // Extract the city with type assertion - safe because we've checked the structure
  const validCity = (listing.city && 
                    typeof listing.city === 'object' && 
                    '_id' in listing.city && 
                    'name' in listing.city && 
                    'slug' in listing.city && 
                    'country' in listing.city) 
    ? (listing.city as any) 
    : null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <article className="space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">{listing.name ?? ''}</h1>
          {validCity && (
            <Link
              href={`/cities/${validCity.slug.current}`}
              className="text-lg text-muted-foreground hover:text-primary"
            >
              {validCity.name}
            </Link>
          )}
        </div>

        <div className="relative h-96 w-full overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1200px"
          />
        </div>

        <ListingDetail
          listing={{
            _id: listing._id,
            name: listing.name ?? '',
            slug: isCanonicalSlug(listing.slug) ? listing.slug : '',
            address: listing.address ?? undefined,
            shortDescription: listing.shortDescription ?? undefined,
            longDescription: listing.longDescription ?? undefined,
            ecoTags: Array.isArray(listing.ecoTags)
              ? (listing.ecoTags as any[]).filter(tag => tag && typeof tag === 'object' && '_id' in tag && 'name' in tag && 'slug' in tag)
              : [],
            galleryImages: Array.isArray(listing.galleryImages) ? listing.galleryImages : [],
            location: isValidLocation(listing.location) ? listing.location : undefined,
            city: validCity ? {
              _id: validCity._id,
              name: validCity.name,
              slug: validCity.slug,
              listingCount: validCity.listingCount,
              country: validCity.country
            } : undefined,
            
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold border-b pb-2 mb-4">About this place</h2>
              <p className="text-muted-foreground">{listing.shortDescription}</p>
              {listing.longDescription && (
                <div className="prose prose-lg max-w-none mt-4">
                  <p>{listing.longDescription}</p>
                </div>
              )}
            </div>

            {listing.shortDescription && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Eco Notes</h3>
                <p className="text-muted-foreground">{listing.shortDescription}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {listing.address && (
                  <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-muted-foreground">{listing.address}</p>
                  </div>
                )}
                {listing.coworkingDetails?.openingHours && listing.coworkingDetails.openingHours.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Coworking Hours</h4>
                    <ul className="text-muted-foreground">
                      {listing.coworkingDetails.openingHours.map((h, index) => (
                        <li key={index}>{h.day}: {h.opens} - {h.closes}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {listing.cafeDetails?.openingHours && listing.cafeDetails.openingHours.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Cafe Hours</h4>
                    <ul className="text-muted-foreground">
                      {listing.cafeDetails.openingHours.map((h, index) => (
                        <li key={index}>{h.day}: {h.opens} - {h.closes}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {listing.accommodationDetails?.openingHours && listing.accommodationDetails.openingHours.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Accommodation Check-in/out</h4>
                    <ul className="text-muted-foreground">
                      {listing.accommodationDetails.openingHours.map((h, index) => (
                        <li key={index}>{h.day}: {h.opens} - {h.closes}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {listing.lastVerifiedDate && (
                  <div>
                    <h4 className="font-semibold">Last Verified</h4>
                    <p className="text-muted-foreground">
                      {new Date(listing.lastVerifiedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {Array.isArray(listing.ecoTags) && listing.ecoTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Eco Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {listing.ecoTags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
