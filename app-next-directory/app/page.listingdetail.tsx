
import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import { mockListingDetail, mockReviews, mockRelatedListings } from '@/components/listings/listingDetailMockData';

export default function ListingDetailPreview() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ListingDetailView 
          listing={mockListingDetail}
          reviews={mockReviews}
          relatedListings={mockRelatedListings}
          isSignedIn={true}
          isFavorited={false}
        />
      </main>
      <Footer />
    </div>
  );
}