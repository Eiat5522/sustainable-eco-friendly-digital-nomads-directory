import { MapContainer } from '@/components/map';
import ListingGrid from '@/components/listings/ListingGrid';
import { promises as fs } from 'fs';
import path from 'path';
import { type Listing } from '@/types/listings';
import { type SanityListing } from '@/types/sanity';
import { getAllListings } from '@/lib/sanity/queries';

export const metadata = {
  title: 'Sustainable Digital Nomad Listings in Thailand',
  description: 'Discover eco-friendly coworking spaces, cafes, and accommodations for digital nomads in Thailand. Explore our interactive map and detailed listings.',
};

// Fallback to JSON file if Sanity is not set up or for development
async function getLegacyListings(): Promise<Listing[]> {
  const filePath = path.join(process.cwd(), 'src/data/listings.json');
  const fileContent = await fs.readFile(filePath, 'utf8');
  const listings = JSON.parse(fileContent);
  return listings;
}

export default async function ListingsPage() {
  let listings: Array<Listing | SanityListing> = [];
  
  try {
    // First try to get listings from Sanity
    const sanityListings = await getAllListings({ limit: 50 });
    
    if (sanityListings && sanityListings.length > 0) {
      // If we got Sanity listings, use those
      listings = sanityListings;
    } else {
      // Otherwise fall back to JSON file
      listings = await getLegacyListings();
    }
  } catch (error) {
    console.error('Error fetching listings:', error);
    // Fall back to JSON file if there's an error
    listings = await getLegacyListings();
  }
  // Helper function to convert Sanity listings to a format compatible with the map
  const getMapCompatibleListings = (listings: Array<Listing | SanityListing>): Listing[] => {
    return listings.map(listing => {
      const isSanityListing = '_type' in listing || 'slug' in listing;
      
      if (isSanityListing) {
        const sanityListing = listing as SanityListing;
        // Convert Sanity listing to format expected by map
        const mapListing: Listing = {
          id: sanityListing._id,
          name: sanityListing.name,
          city: typeof sanityListing.city === 'string' ? sanityListing.city : 'Unknown',
          category: sanityListing.category,
          address_string: sanityListing.addressString || '',
          coordinates: {
            latitude: sanityListing.coordinates?.lat || null,
            longitude: sanityListing.coordinates?.lng || null,
          },
          description_short: sanityListing.descriptionShort || '',
          description_long: sanityListing.descriptionLong || '',
          eco_focus_tags: Array.isArray(sanityListing.ecoTags) ? sanityListing.ecoTags : [],
          eco_notes_detailed: sanityListing.ecoNotesDetailed || '',
          source_urls: Array.isArray(sanityListing.sourceUrls) ? sanityListing.sourceUrls : [],
          primary_image_url: '', // Will be handled by the component
          gallery_image_urls: [],
          digital_nomad_features: Array.isArray(sanityListing.nomadFeatures) ? sanityListing.nomadFeatures : [],
          last_verified_date: sanityListing.lastVerifiedDate || '',
        };
        return mapListing;
      }
      
      return listing as Listing;
    });
  };
  
  const mapListings = getMapCompatibleListings(listings);

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Page Header */}
      <div className="bg-primary-500 border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white">Sustainable Locations</h1>
          <p className="mt-2 text-lg text-white">
            Discover eco-friendly spaces for digital nomads across Thailand
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Map Section */}
        <section className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white p-4 rounded-lg shadow-lg overflow-hidden">
            <MapContainer listings={mapListings} />
          </div>
        </section>

        {/* Filters Section */}
        <section className="mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Filter Listings</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-category-coworking"></span>
                <span className="text-sm">Coworking Spaces</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-category-cafe"></span>
                <span className="text-sm">Cafes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-category-accommodation"></span>
                <span className="text-sm">Accommodations</span>
              </div>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            All Listings
          </h2>
          <ListingGrid listings={listings} useSlug={true} />
        </section>
      </div>
    </div>
  );
}
