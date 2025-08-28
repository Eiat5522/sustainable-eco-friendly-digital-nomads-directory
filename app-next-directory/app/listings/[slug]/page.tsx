import { ListingDetailView } from '@/components/listings/ListingDetailView';
import { mockListingDetail, mockReviews, mockRelatedListings } from '@/components/listings/listingDetailMockData';
import type { ListingDetailDTO } from '@/types/dto';

type Props = {
  params: { slug: string };
};

async function getListingData(slug: string): Promise<ListingDetailDTO | null> {
  if (!slug || slug === 'invalid-slug') {
    return null;
  }

  // Simulate a network request
  await new Promise(resolve => setTimeout(resolve, 800));

  // Use mock data based on slug or default to Banyan Tree
  return { ...mockListingDetail, slug };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = params;
  const listing = await getListingData(slug);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="body-lg text-red-500 mb-4">Listing not found</p>
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