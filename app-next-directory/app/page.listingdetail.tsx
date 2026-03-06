import 'leaflet/dist/leaflet.css';
import { PageLayoutServer } from '@/components/layout/PageLayoutServer';
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import {
  mockListingDetail,
  mockRelatedListings,
  mockReviews,
} from '@/components/listings/listingDetailMockData';

export default function ListingDetailPreview() {
  return (
    <PageLayoutServer>
      <main>
        <ListingDetailView
          listing={mockListingDetail}
          reviews={mockReviews}
          relatedListings={mockRelatedListings}
          isSignedIn={true}
          isFavorited={false}
        />
      </main>
    </PageLayoutServer>
  );
}
