
'use client';

import { ListingDetailView } from '@/components/listings/ListingDetailView';
import { mockListingDetail, mockReviews, mockRelatedListings } from '@/components/listings/listingDetailMockData';
import type { ListingDetailDTO } from '@/types/dto';
import { useEffect, useState } from 'react';

type Props = {
  params: { slug: string };
};

export default function ListingPage({ params }: Props) {
  const { slug } = params;
  const [listing, setListing] = useState<ListingDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!slug || slug === 'invalid-slug') {
        setError('Listing not found.');
        setLoading(false);
        return;
      }

      try {
        // Simulate a network request
        await new Promise(resolve => setTimeout(resolve, 800));

        // Use mock data based on slug or default to Banyan Tree
        const listingData = { ...mockListingDetail, slug };
        setListing(listingData);
      } catch (err) {
        setError('Failed to fetch listing.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neo-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="body-lg text-neo-text-secondary">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="body-lg text-red-500 mb-4">{error || 'Listing not found'}</p>
          <a href="/" className="text-neo-primary hover:underline">
            Return to homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <ListingDetailView 
      listing={listing}
      reviews={mockReviews}
      relatedListings={mockRelatedListings}
      isSignedIn={true} // Mock signed-in state
      isFavorited={false} // Mock favorite state
    />
  );
}