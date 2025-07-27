import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getListingData } from '@/lib/sanity/data';
import { urlFor } from '@/lib/sanity/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ListingDetail from '@/components/listings/ListingDetail';
import { AppListingDetail, AppCity } from '@/types/appView';

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingData(slug);

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

  const appListing: AppListingDetail = {
    id: listing._id,
    name: listing.name,
    slug: listing.slug || '',
    city: listing.city ? {
      id: listing.city._id,
      name: listing.city.name || '',
      slug: listing.city.slug || '',
      country: listing.city.country || ''
    } : null,
    ecoTags: listing.ecoTags || [],
    nomadFeatures: listing.nomadFeatures || [],
    contactPhone: listing.contactPhone,
    contactEmail: listing.contactEmail,
    website: listing.website,
    priceRange: listing.priceRange,
    shortDescription: listing.shortDescription,
    longDescription: listing.longDescription,
    address: listing.address,
    location: listing.location,
    primaryImage: listing.primaryImage,
    galleryImages: listing.galleryImages,
    lastVerifiedDate: listing.lastVerifiedDate,
    reviews: listing.reviews,
    coworkingDetails: listing.coworkingDetails,
    accommodationDetails: listing.accommodationDetails,
    cafeDetails: listing.cafeDetails,
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <article className="space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">{appListing.name}</h1>
          {appListing.city && (
            <Link
              href={`/cities/${appListing.city.slug}`}
              className="text-lg text-muted-foreground hover:text-primary"
            >
              {appListing.city.name}
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

        <ListingDetail listing={appListing} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold border-b pb-2 mb-4">About this place</h2>
              <p className="text-muted-foreground">{appListing.shortDescription}</p>
              {appListing.longDescription && (
                <div className="prose prose-lg max-w-none mt-4">
                  <p>{appListing.longDescription}</p>
                </div>
              )}
            </div>

            {appListing.shortDescription && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Eco Notes</h3>
                <p className="text-muted-foreground">{appListing.shortDescription}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {appListing.address && (
                  <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-muted-foreground">{appListing.address}</p>
                  </div>
                )}
                {appListing.coworkingDetails?.openingHours && appListing.coworkingDetails.openingHours.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Coworking Hours</h4>
                    <ul className="text-muted-foreground">
                      {appListing.coworkingDetails.openingHours.map((h, index) => (
                        <li key={index}>{h.day}: {h.opens} - {h.closes}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {appListing.cafeDetails?.openingHours && appListing.cafeDetails.openingHours.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Cafe Hours</h4>
                    <ul className="text-muted-foreground">
                      {appListing.cafeDetails.openingHours.map((h, index) => (
                        <li key={index}>{h.day}: {h.opens} - {h.closes}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {appListing.accommodationDetails?.openingHours && appListing.accommodationDetails.openingHours.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Accommodation Check-in/out</h4>
                    <ul className="text-muted-foreground">
                      {appListing.accommodationDetails.openingHours.map((h, index) => (
                        <li key={index}>{h.day}: {h.opens} - {h.closes}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {appListing.lastVerifiedDate && (
                  <div>
                    <h4 className="font-semibold">Last Verified</h4>
                    <p className="text-muted-foreground">
                      {new Date(appListing.lastVerifiedDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {Array.isArray(appListing.ecoTags) && appListing.ecoTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Eco Tags</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {appListing.ecoTags.map((tag: string) => (
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
