import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { ListingDetail } from '@/components/listings/ListingDetail';
import { RelatedListings } from '@/components/listings/RelatedListings';
import dynamic from 'next/dynamic';

// Mock listing data to demonstrate the issues
const mockListing = {
  _id: 'test-listing',
  name: 'Test Eco Coworking Space',
  slug: { current: 'test-eco-coworking-space' },
  description_short: 'A sustainable coworking space in Bangkok with eco-friendly features',
  description_long: 'This is a detailed description of our eco-friendly coworking space. We feature solar panels, recycled materials, and a green roof garden. Perfect for digital nomads who care about the environment.',
  category: 'coworking',
  city: { name: 'Bangkok', country: 'Thailand' },
  location: { lat: 13.7563, lng: 100.5018 },
  images: [
    { asset: { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600' } },
    { asset: { url: 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&h=600' } },
    { asset: { url: 'https://images.unsplash.com/photo-1600880292201-fd07d3a76d18?w=800&h=600' } },
    { asset: { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600' } }
  ],
  primary_image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600',
  eco_features: ['Solar Power', 'Recycled Materials', 'Green Roof', 'Energy Efficient Lighting'],
  amenities: ['High-speed WiFi', 'Coffee Bar', 'Meeting Rooms', 'Printing Services'],
  contact_phone: '+66 2 123 4567',
  contact_email: 'hello@ecocoworking.com',
  website: 'https://ecocoworking.com',
  price_range: 'Moderate',
  reviews: [
    {
      rating: 5,
      comment: 'Amazing eco-friendly workspace! Love the green roof.',
      author: 'Digital Nomad',
      date: '2024-01-15'
    },
    {
      rating: 4,
      comment: 'Great facilities and very sustainable practices.',
      author: 'Remote Worker',
      date: '2024-01-10'
    }
  ],
  sustainabilityScore: 85
};

// Dynamically import improved Map component to avoid SSR issues
const ImprovedMap = dynamic(() => import('@/components/map/ImprovedMap'), { 
  loading: () => <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
});

export default function TestListingPage() {
  return (
    <main className="container mx-auto py-12 px-4 sm:px-6">
      <Breadcrumbs
        segments={[
          { name: 'Listings', href: '/listings' },
          { name: mockListing.name, href: `/test/listing` },
        ]}
      />

      <article className="bg-stone-50 dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg">
        {/* Image Gallery Section - Issue: Images very large, gallery not interactive */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Image Gallery (Current Issues)</h2>
          <ImageGallery
            images={mockListing.images.map(img => img.asset.url)}
            alt={`Photos of ${mockListing.name}`}
          />
        </div>

        {/* Map Section - Issue: Leaflet map not displaying */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Location Map (Current Issues)</h2>
          <div className="h-64 border border-gray-300 rounded-lg">
            <ImprovedMap 
              listings={[{
                coordinates: {
                  latitude: mockListing.location.lat,
                  longitude: mockListing.location.lng
                },
                name: mockListing.name,
                category: mockListing.category
              }]}
              center={[mockListing.location.lat, mockListing.location.lng]}
              zoom={13}
            />
          </div>
        </div>

        {/* Listing Detail Component - Issue: Data shape misalignment */}
        <ListingDetail listing={{
          ...mockListing,
          description_short: mockListing.description_short,
          description_long: mockListing.description_long,
          eco_features: mockListing.eco_features,
          gallery_images: mockListing.images?.map(img => img.asset.url) || [],
          reviews: mockListing.reviews.map(review => ({
            ...review,
            _createdAt: review.date
          }))
        }} />
      </article>

      {/* TODO: Fix RelatedListings component */}
      {/* <RelatedListings
        slug="test-eco-coworking-space"
        category={mockListing.category}
        cityName={mockListing.city.name}
      /> */}
    </main>
  );
}