import { MapContainer } from '@/components/map';
import ListingGrid from '@/components/listings/ListingGrid';
import { promises as fs } from 'fs';
import path from 'path';
import { type Listing } from '@/types/listings';

export const metadata = {
  title: 'Sustainable Digital Nomad Listings in Thailand',
  description: 'Discover eco-friendly coworking spaces, cafes, and accommodations for digital nomads in Thailand. Explore our interactive map and detailed listings.',
};

async function getListings(): Promise<Listing[]> {
  const filePath = path.join(process.cwd(), 'src/data/listings.json');
  const fileContent = await fs.readFile(filePath, 'utf8');
  const listings = JSON.parse(fileContent);
  return listings;
}

export default async function ListingsPage() {
  const listings = await getListings();

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
            <MapContainer listings={listings} />
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
                <span className="text-sm">Eco Cafes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-category-accommodation"></span>
                <span className="text-sm">Sustainable Accommodation</span>
              </div>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        <section className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">All Listings ({listings.length})</h2>
            <ListingGrid listings={listings} />
          </div>
        </section>
      </div>
    </div>
  );
}
