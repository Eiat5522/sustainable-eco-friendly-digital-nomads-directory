import { ReviewsSection } from '@/components/listings/ReviewsSection';

const sampleReviews = [
  {
    id: 'existing-review-1',
    rating: 4,
    comment: 'Loved the solar-powered workspaces and community events focused on sustainability.',
    user: { name: 'Jordan Rivers' },
    createdAt: '2024-05-01T12:00:00Z',
    status: 'approved' as const,
  },
];

type SearchParams = {
  signedIn?: string | string[];
  preset?: string | string[];
};

function pickFirst(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function TestReviewsPage(props: { searchParams?: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const resolved = searchParams ?? ({} as SearchParams);
  const signedInValue = pickFirst(resolved?.signedIn);
  const presetValue = pickFirst(resolved?.preset);

  const isSignedIn = signedInValue === '1' || signedInValue === 'true';
  const initialReviews = presetValue === 'with-initial' ? sampleReviews : [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Test Reviews Section</h1>
      <div data-testid="test-reviews-section">
        <ReviewsSection
          reviews={initialReviews}
          listingId="test-listing-123"
          isSignedIn={isSignedIn}
        />
      </div>
    </div>
  );
}
