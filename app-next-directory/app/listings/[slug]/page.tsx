import type {
  Listing as SanityListing,
  City as SanityCity,
  EcoTag as SanityEcoTag,
  Review as SanityReview
} from '../../../../sanity/sanity.types';

type Listing = SanityListing & {
  website?: string;
  contactInfo?: string;
  openingHours?: string;
  priceRange?: string;
};

type City = SanityCity;
type EcoTag = SanityEcoTag;
type Review = SanityReview;


import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getListingData } from '@/lib/sanity/data';
import { urlFor } from '@/lib/sanity/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ListingDetail from '@/components/listings/ListingDetail';

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing: Listing | null = await getListingData(slug);

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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <article className="space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">{listing.name ?? ''}</h1>
          {listing.city && typeof listing.city === 'object' && 'slug' in listing.city && (
            <Link
              href={`/cities/${
                typeof (listing.city as any).slug === 'string'
                  ? (listing.city as any).slug
                  : (listing.city as any).slug?.current ?? ''
              }`}
              className="text-lg text-muted-foreground hover:text-primary"
            >
              {(listing.city as any).title ?? ''}
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
            ...listing,
            name: listing.name ?? '',
            slug:
              listing.slug && typeof listing.slug === 'string'
                ? { current: listing.slug || '' }
                : (listing.slug && typeof listing.slug === 'object' && listing.slug.current ? { current: listing.slug.current || '' } : { current: '' }),
            shortDescription: listing.shortDescription ?? undefined,
            longDescription: listing.longDescription ?? undefined,
            ecoTags: Array.isArray(listing.ecoTags)
              ? listing.ecoTags.filter(tag => tag && typeof tag === 'object' && 'name' in tag)
              : [],
            mainImage:
              Array.isArray(listing.galleryImages) && listing.galleryImages.length > 0
                ? listing.galleryImages[0]
                : undefined,
            galleryImages: Array.isArray(listing.galleryImages) ? listing.galleryImages : [],
            website: listing.website ?? undefined,
            priceRange: listing.priceRange ?? undefined,
            location:
              listing.city && typeof listing.city === 'object' && 'slug' in listing.city
                ? {
                    lat: (listing as any).location?.lat,
                    lng: (listing as any).location?.lng,
                  }
                : undefined,
            city: listing.city && typeof listing.city === 'object' && 'slug' in listing.city ? listing.city : undefined,
            reviews: Array.isArray(listing.reviews)
              ? listing.reviews.filter(r => r && typeof r === 'object' && 'author' in r)
              : [],
            contactInfo: listing.contactInfo ?? undefined,
            openingHours: listing.openingHours ?? undefined,
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
                {listing.website && (
                  <div>
                    <h4 className="font-semibold">Website</h4>
                    <a
                      href={listing.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit website
                    </a>
                  </div>
                )}
                {listing.contactInfo && (
                  <div>
                    <h4 className="font-semibold">Contact</h4>
                    <p className="text-muted-foreground">{listing.contactInfo}</p>
                  </div>
                )}
                {listing.openingHours && (
                  <div>
                    <h4 className="font-semibold">Hours</h4>
                    <p className="text-muted-foreground">{listing.openingHours}</p>
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

            {Array.isArray(listing.ecoTags) && listing.ecoTags.some(tag => tag && typeof tag === 'object' && 'name' in tag) && (
              <Card>
                <CardHeader>
                  <CardTitle>Eco Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {listing.ecoTags
                    .filter(tag => tag && typeof tag === 'object' && 'name' in tag)
                    .map((tag: any) => (
                      <Badge key={tag._id} variant="secondary">
                        {tag.name}
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
