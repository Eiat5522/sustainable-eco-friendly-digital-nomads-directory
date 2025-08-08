import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ImageGallery } from '@/components/listings/ImageGallery';
import { ListingDetail } from '@/components/listings/ListingDetail';

// Use simpler placeholder images that should work better
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
    { asset: { url: 'https://picsum.photos/800/600?random=1' } },
    { asset: { url: 'https://picsum.photos/800/600?random=2' } },
    { asset: { url: 'https://picsum.photos/800/600?random=3' } },
    { asset: { url: 'https://picsum.photos/800/600?random=4' } }
  ],
  primary_image_url: 'https://picsum.photos/800/600?random=1',
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

export default function TestListingFixedPage() {
  return (
    <main className="container mx-auto py-12 px-4 sm:px-6">
      <Breadcrumbs
        segments={[
          { name: 'Listings', href: '/listings' },
          { name: mockListing.name, href: `/test/listing-fixed` },
        ]}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Image Gallery Section - Now Fixed */}
        <div className="mb-8">
          <div className="p-6 pb-0">
            <h2 className="text-xl font-semibold mb-4 text-green-600">🎯 Fixed: Interactive Image Gallery</h2>
          </div>
          <div className="px-6">
            <ImageGallery
              images={mockListing.images.map(img => img.asset.url)}
              alt={`Photos of ${mockListing.name}`}
            />
          </div>
        </div>

        {/* Listing Detail Component - Now with integrated map and proper styling */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-6 pb-0">
            <h2 className="text-xl font-semibold mb-4 text-green-600">🎯 Fixed: Listing Details with Integrated Map</h2>
          </div>
          <ListingDetail listing={{
            name: mockListing.name,
            description_short: mockListing.description_short,
            description_long: mockListing.description_long,
            category: mockListing.category,
            eco_features: mockListing.eco_features,
            amenities: mockListing.amenities,
            primary_image_url: mockListing.primary_image_url,
            gallery_images: mockListing.images.map(img => img.asset.url),
            city: mockListing.city,
            location: mockListing.location,
            website: mockListing.website,
            contact_email: mockListing.contact_email,
            contact_phone: mockListing.contact_phone,
            price_range: mockListing.price_range,
            reviews: mockListing.reviews.map(review => ({
              ...review,
              _createdAt: review.date
            }))
          }} />
        </div>
      </div>

      {/* Summary of fixes */}
      <div className="mt-8 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">✅ Issues Fixed:</h3>
        <ul className="space-y-2 text-green-700 dark:text-green-300">
          <li>• <strong>Large primary image issue:</strong> Removed duplicate large image display from ListingDetail component</li>
          <li>• <strong>Interactive image gallery:</strong> Gallery now properly displays all images with working thumbnails</li>
          <li>• <strong>Leaflet map integration:</strong> Map component now properly integrated within listing details</li>
          <li>• <strong>Data shape alignment:</strong> Fixed data mapping between Sanity CMS and component interfaces</li>
          <li>• <strong>Improved styling:</strong> Better layout organization and visual hierarchy</li>
        </ul>
      </div>
    </main>
  );
}