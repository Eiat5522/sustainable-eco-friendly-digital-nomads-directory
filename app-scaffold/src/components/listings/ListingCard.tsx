import Image from 'next/image';
import Link from 'next/link';
import { Listing } from '@/types/listings';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  // Common content for all listing types
  const commonContent = (
    <div className="relative bg-stone-50 dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl overflow-hidden h-full border border-stone-200 dark:border-slate-700 hover:border-green-600 dark:hover:border-green-500 transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 w-full bg-stone-200 dark:bg-slate-700">
        {listing.primary_image_url ? (
          <Image
            src={listing.primary_image_url}
            alt={listing.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={80}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0dHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//2wBDAR0XFyMeIyEeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyMeIyP/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-stone-400 dark:text-slate-500">No image available</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow"> {/* Added flex-grow and flex-col */}
        {/* Category Badge */}
        <div className="mb-2">
          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${ // rounded-full for pill shape
            listing.category === 'coworking' 
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' // Terracotta-like
              : listing.category === 'cafe'
              ? 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100' // Blush Pink-like
              : 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100' // Soft Teal for Accommodation
          }`}>
            {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{listing.name}</h3> {/* Reduced mb */}
        
        {/* Location */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{listing.city}</p>

        {/* Short Description */}
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-2 flex-grow"> {/* Added flex-grow */}
          {listing.description_short}
        </p>

        {/* Eco Tags */}
        {listing.eco_focus_tags && listing.eco_focus_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3"> {/* Increased gap, reduced mb */}
            {listing.eco_focus_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2.5 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full" // Deep Forest Green-like
              >
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
            {listing.eco_focus_tags.length > 3 && (
              <span className="inline-block px-2.5 py-1 text-xs bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200 rounded-full">
                +{listing.eco_focus_tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Digital Nomad Features */}
        {listing.digital_nomad_features && listing.digital_nomad_features.length > 0 && (
          <div className="flex flex-wrap gap-1.5"> {/* Increased gap */}
            {listing.digital_nomad_features.slice(0, 2).map((feature) => (
              <span
                key={feature}
                className="inline-block px-2.5 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full" // Soft Beige-like
              >
                {feature.replace(/_/g, ' ')}
              </span>
            ))}
            {listing.digital_nomad_features.length > 2 && (
              <span className="inline-block px-2.5 py-1 text-xs bg-stone-200 text-stone-700 dark:bg-slate-700 dark:text-slate-200 rounded-full">
                +{listing.digital_nomad_features.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Link href={`/listings/${listing.id}`} className="block h-full">
      <article className="h-full transition-transform hover:scale-[1.02] duration-200">
        {commonContent}
      </article>
    </Link>
  );
}
