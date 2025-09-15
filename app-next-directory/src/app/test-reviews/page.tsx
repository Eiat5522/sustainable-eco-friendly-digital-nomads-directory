import { ReviewsSection } from '@/components/listings/ReviewsSection';

export default function TestReviewsPage() {
  const mockReviews = [];
  const mockListingId = 'test-listing-123';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Test Reviews Section</h1>
      <div data-testid="test-reviews-section">
        <ReviewsSection 
          reviews={mockReviews}
          listingId={mockListingId}
          isSignedIn={false}
        />
      </div>
    </div>
  );
}