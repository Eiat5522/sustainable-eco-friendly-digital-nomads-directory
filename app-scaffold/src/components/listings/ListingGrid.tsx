import Link from 'next/link';
import Image from 'next/image';
import { type Listing } from '@/types/listings';

interface ListingGridProps {
  listings: Listing[];
}

export default function ListingGrid({ listings }: ListingGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing, index) => (
        <Link
          key={listing.id}
          href={`/listings/${listing.id}`}
          className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 animate-slide-up"
          style={{ animationDelay: `${0.1 * index}s` }}
        >
          <div className="relative h-48 rounded-lg">
            <Image
              src={listing.primary_image_url}
              alt={listing.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute top-4 right-4 z-10">
              <span className={`
                inline-block px-3 py-1 text-sm font-medium rounded-full 
                ${listing.category === 'coworking' ? 'bg-category-coworking text-white' :
                  listing.category === 'cafe' ? 'bg-category-cafe text-white' :
                  'bg-category-accommodation text-white'}
                shadow-sm
              `}>
                {listing.category}
              </span>
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-bold text-xl mb-2 group-hover:text-primary-600 transition-colors">
              {listing.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {listing.description_short}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {listing.eco_focus_tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded capitalize"
                >
                  {tag.replace(/_/g, ' ')}
                </span>
              ))}
              {listing.eco_focus_tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{listing.eco_focus_tags.length - 3} more
                </span>
              )}
            </div>

            <div className="text-sm text-gray-500">
              <p className="line-clamp-1">{listing.address_string}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
