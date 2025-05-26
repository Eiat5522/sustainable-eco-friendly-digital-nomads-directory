import { HeroSection } from '@/components/HeroSection';
import { promises as fs } from 'fs';
import Image from 'next/image';
import path from 'path';

type ListingImage = {
  thumbnail: { jpg: string; webp: string; };
  small: { jpg: string; webp: string; };
  medium: { jpg: string; webp: string; };
  large: { jpg: string; webp: string; };
};

type Listing = {
  id: string;
  name: string;
  city: string;
  category: string;
  description_short: string;
  primary_image: ListingImage;
  gallery_images: ListingImage[];
};

async function getListings(): Promise<Listing[]> {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'src/data/listings/Listing_Population_Template.csv');
    const csvData = await fs.readFile(csvPath, 'utf-8');

    // Parse CSV to JSON
    const listings = csvData
      .split('\n')
      .slice(1) // Skip header row
      .filter(Boolean)
      .map(row => {
        const columns = row.split(',');
        const record: any = {};

        // Parse each column based on header
        const headers = csvData.split('\n')[0].split(',');
        headers.forEach((header, index) => {
          let value = columns[index]?.trim();
          if (value) {
            try {
              // Try to parse JSON fields
              if (header === 'primary_image' || header === 'gallery_images' ||
                  header === 'coordinates' || header === 'eco_focus_tags' ||
                  header === 'digital_nomad_features') {
                record[header] = JSON.parse(value);
              } else {
                record[header] = value;
              }
            } catch (e) {
              record[header] = value;
            }
          }
        });

        return record as Listing;
      });

    return listings;
  } catch (error) {
    console.error('Error loading listings:', error);
    return [];
  }
}

export default async function PreviewPage() {
  const listings = await getListings();

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        title="Sustainable Digital Nomads"
        subtitle="Find eco-friendly spaces for remote work around the world"
      />

      <div className="container mx-auto py-12 px-4">
        <h2 className="text-3xl font-semibold text-center mb-8">
          Listings Preview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white border rounded-lg overflow-hidden shadow-lg">
              {listing.primary_image && (
                <div className="relative h-48">
                  <picture>
                    <source
                      srcSet={listing.primary_image.medium.webp}
                      type="image/webp"
                    />
                    <Image
                      src={listing.primary_image.medium.jpg}
                      alt={listing.name}
                      fill
                      className="object-cover"
                    />
                  </picture>
                </div>
              )}

              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{listing.name}</h2>
                <div className="flex gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {listing.city}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {listing.category}
                  </span>
                </div>
                <p className="text-gray-600">{listing.description_short}</p>

                {listing.gallery_images && listing.gallery_images.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Gallery</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {listing.gallery_images.map((image, idx) => (
                        <div key={idx} className="relative h-20">
                          <picture>
                            <source
                              srcSet={image.thumbnail.webp}
                              type="image/webp"
                            />
                            <Image
                              src={image.thumbnail.jpg}
                              alt={`${listing.name} gallery ${idx + 1}`}
                              fill
                              className="object-cover rounded"
                            />
                          </picture>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
