import React from 'react';
import { getListingData } from '@/lib/sanity/data';
import { notFound } from 'next/navigation';

export default async function ListingPage({ params }: { params: { slug: string } }) {
  // Fetch listing data using your data fetching helper
  const listing = await getListingData(params.slug);

  // Check if listing is missing or if its "name" property is null/undefined
  if (!listing || !listing.name) {
    // Render a fallback message if critical data is missing.
    return <div>Listing not found or data is incomplete.</div>;
    // Alternatively, trigger a Next.js 404 page by calling notFound():
    // notFound();
  }

  return (
    <div>
      <h1>{listing.name}</h1>
      {/* Render additional listing details here */}
    </div>
  );
}
