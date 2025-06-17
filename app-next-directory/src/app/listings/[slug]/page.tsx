import React from 'react';
import { getListingData } from '@/lib/sanity/data';
import { urlFor } from '@/lib/sanity/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListingDetail } from '@/components/listings/ListingDetail';

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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <article className="space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">{listing.name}</h1>
          {listing.city && (
            <Link href={`/cities/${listing.city.slug}`} className="text-lg text-muted-foreground hover:text-primary">
              {listing.city.title}
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

        <ListingDetail listing={listing} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold border-b pb-2 mb-4">About this place</h2>
              <p className="text-muted-foreground">{listing.description_short}</p>
              {listing.description_long && (
                <div className="prose prose-lg max-w-none mt-4">
                  {/* Assuming description_long is a string for now. If it's Portable Text, this will need a proper renderer */}
                  <p>{listing.description_long}</p>
                </div>
              )}
            </div>

            {listing.ecoNotesDetailed && (
               <div>
                  <h3 className="text-xl font-semibold mb-2">Eco Notes</h3>
                  <p className="text-muted-foreground">{listing.ecoNotesDetailed}</p>
               </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {listing.addressString && (
                  <div>
                    <h4 className="font-semibold">Address</h4>
                    <p className="text-muted-foreground">{listing.addressString}</p>
                  </div>
                )}
                {listing.website && (
                  <div>
                    <h4 className="font-semibold">Website</h4>
                    <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
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
                {listing.last_verified_date && (
                  <div>
                    <h4 className="font-semibold">Last Verified</h4>
                    <p className="text-muted-foreground">{new Date(listing.last_verified_date).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {listing.ecoTags && listing.ecoTags.length > 0 && (
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
