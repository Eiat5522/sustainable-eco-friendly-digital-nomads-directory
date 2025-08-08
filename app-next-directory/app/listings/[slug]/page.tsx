import React from 'react';
import { notFound } from 'next/navigation';
import { getListingData } from '@/lib/sanity/data';
import ListingDetail from '@/components/listings/ListingDetail';
import { AppListingDetail } from '@/types/appView';

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingData(slug);

  if (!listing || !listing.name) {
    return notFound();
  }

  const appListing: AppListingDetail = {
    id: listing.id,
    name: listing.name,
    slug: listing.slug || '',
    city: listing.city ? {
      id: listing.city.id,
      name: listing.city.name || '',
      slug: listing.city.slug || '',
      country: listing.city.country || ''
    } : null,
    type: listing.type,
    ecoFocusTags: listing.ecoFocusTags || [],
    digitalNomadFeatures: listing.digitalNomadFeatures || [],
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
    restaurantDetails: listing.restaurantDetails,
    activitiesDetails: listing.activitiesDetails,
    amenities: listing.amenities,
  };

  return <ListingDetail listing={appListing} />;
}
