import 'leaflet/dist/leaflet.css';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ListingDetailView } from '@/components/listings/ListingDetailView';
import {
  mockListingDetail,
  mockRelatedListings,
  mockReviews,
} from '@/components/listings/listingDetailMockData';

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
