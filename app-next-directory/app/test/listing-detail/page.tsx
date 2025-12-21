import 'leaflet/dist/leaflet.css';
import { headers } from 'next/headers';
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import {
  mockListingDetail,
  mockRelatedListings,
  mockReviews,
} from '@/components/listings/listingDetailMockData';

// Dev-only route for exercising `ListingDetailView`. Enable locally via `ENABLE_TEST_PAGES=true`.
export default function ListingDetailTestPage() {
  headers();

  const isTestPageEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_TEST_PAGES === 'true' ||
    process.env.NEXT_PUBLIC_E2E === '1' ||
    process.env.E2E === '1';

  if (!isTestPageEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          This test page is not available in production.
        </p>
      </main>
    );
  }

  const listingWithGallery = {
    ...mockListingDetail,
    galleryImages: [
      '/test-images/gallery-1.svg',
      '/test-images/gallery-2.svg',
      '/test-images/gallery-3.svg',
    ],
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <ListingDetailView
          listing={listingWithGallery}
          reviews={mockReviews}
          relatedListings={mockRelatedListings}
          isSignedIn={false}
          isFavorited={false}
        />
      </div>
    </main>
  );
}
