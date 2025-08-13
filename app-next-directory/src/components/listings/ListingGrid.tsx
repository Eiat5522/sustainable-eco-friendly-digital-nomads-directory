import Image from 'next/image';
import Link from 'next/link';
import { AppListingCard } from '@/types/appView';

interface ListingGridProps {
  listings: AppListingCard[];
}

function resolveSlug(slug: string | { current?: string } | null | undefined): string | undefined {
  if (typeof slug === 'string') return slug;
  if (slug && typeof slug === 'object' && typeof slug.current === 'string') return slug.current;
  return undefined;
}

export function ListingGrid({ listings }: ListingGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 p-4 md:p-6">
      {listings.map((listing, index) => (
        <div
          key={listing.id ?? (resolvedSlug ?? `idx-${index}`)}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out"
        >
        <Link href={href}>
          <a className="group block">
            <div className="relative h-48 overflow-hidden">
            <Image
              src={listing.imageUrl || '/images/sustainable_nomads.png'}
              alt={listing.name || 'Listing image'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 3} // Prioritize loading for the first few images
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                console.warn('Image failed to load:', listing.imageUrl);
                e.currentTarget.src = '/images/sustainable_nomads.png';
              }}
            />
            <div className="absolute top-4 right-4 z-10">
              <span
                className={`
                inline-block px-3 py-1 text-sm font-medium rounded-full
                ${listing.type === 'coworking' ? 'bg-category-coworking text-white' :
                  listing.type === 'cafe' ? 'bg-category-cafe text-white' :
                  'bg-category-accommodation text-white'}
                shadow-sm
              `}>
                {listing.type}
              </span>
            </div>
            </div>
          </a>
        </Link>

        <div className="p-6">
          <h3 className="font-bold text-xl mb-2 hover:text-primary-600 transition-colors">
            <Link href={{ pathname: '/listings/[slug]', query: { slug: resolveSlug(listing.slug) ?? '' } }}>
              {listing.name}
            </Link>
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {listing.shortDescription || (listing as any).descriptionShort || (listing as any).description_short || ''}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {listing.ecoFocusTags?.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={`${listing.id}-tag-${tagIndex}`}
                className="inline-block px-2 py-1 text-xs bg-primary-50 text-primary-700 rounded capitalize"
              >
                {String(tag).replace(/_/g, ' ')}
              </span>
            ))}
            {listing.ecoFocusTags && listing.ecoFocusTags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                +{listing.ecoFocusTags.length - 3} more
              </span>
            )}
          </div>

          <div className="text-sm text-gray-500">
            <p className="line-clamp-1">{listing.address || (listing as any).addressString || (listing as any).address_string || ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

