import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/image';
import { AppListingCard } from '@/types/appView';

interface FeaturedListingsProps {
  listings: AppListingCard[];
}

export default function FeaturedListings({ listings }: FeaturedListingsProps) {
  if (!listings || listings.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-center text-gray-600">No featured listings available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">Featured Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {listings.slice(0, 4).map(listing => {
            const imageUrl = listing.imageUrl || '/placeholder-city.jpg';

            return (
              <article
                key={listing.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col"
              >
                <Link href={`/listings/${listing.slug}`} className="block group">
                  <div className="relative w-full h-56 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={listing.name}
                      width={500}
                      height={300}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      className="group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33.333vw"
                      priority={true}
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        console.warn('Featured image failed to load:', imageUrl);
                        e.currentTarget.src = '/images/sustainable_nomads.png';
                      }}
                    />
                  </div>
                </Link>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="hover:text-green-600 transition-colors duration-200 line-clamp-2"
                    >
                      {listing.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                    {listing.city?.name}, {listing.city?.country}
                  </p>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-green-600">
                        {listing.priceRange}
                      </span>
                    </div>
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="block w-full text-center bg-green-500 text-white py-2.5 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

