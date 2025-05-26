import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OptimizedImage } from './OptimizedImage'
import type { AnyListing } from '@/types/listing'

interface ListingGridProps {
  listings: AnyListing[]
  viewMode?: 'grid' | 'list'
  className?: string
  onListingClick?: (listing: AnyListing) => void
}

export function ListingGrid({
  listings,
  viewMode = 'grid',
  className = '',
  onListingClick,
}: ListingGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleClick = (listing: AnyListing) => {
    if (onListingClick) {
      onListingClick(listing)
    }
  }

  return (
    <div
      className={`${
        viewMode === 'grid'
          ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'space-y-6'
      } ${className}`}
    >
      <AnimatePresence>
        {listings.map((listing) => (
          <motion.div
            key={listing._id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            className={`group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-xl ${
              viewMode === 'list' ? 'flex gap-6' : ''
            }`}
            onMouseEnter={() => setHoveredId(listing._id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleClick(listing)}
          >
            {/* Image Container */}
            <div
              className={`relative overflow-hidden ${
                viewMode === 'list' ? 'h-48 w-48 flex-shrink-0' : 'aspect-[4/3]'
              }`}
            >
              <OptimizedImage
                image={listing.mainImage}
                alt={listing.name}
                fill
                sizes={viewMode === 'list' ? '12rem' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                className="object-cover"
              />
              
              {/* Eco Tags Overlay */}
              <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                {listing.ecoTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag._id}
                    className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                  >
                    {tag.name}
                  </span>
                ))}
                {listing.ecoTags.length > 3 && (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    +{listing.ecoTags.length - 3}
                  </span>
                )}
              </div>

              {/* Price Range Badge */}
              <div className="absolute right-2 top-2">
                <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-800 shadow-sm">
                  {listing.priceRange === 'budget'
                    ? '💰'
                    : listing.priceRange === 'moderate'
                    ? '💰💰'
                    : '💰💰💰'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{listing.name}</h3>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">{listing.rating}</span>
                  <svg
                    className="ml-1 h-4 w-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>

              <p className="mb-2 text-sm text-gray-600">
                {listing.city.name}, {listing.city.country}
              </p>

              {viewMode === 'list' && (
                <p className="mb-4 line-clamp-2 text-sm text-gray-500">{listing.description}</p>
              )}

              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      {
                        coworking: 'bg-purple-100 text-purple-800',
                        cafe: 'bg-yellow-100 text-yellow-800',
                        accommodation: 'bg-blue-100 text-blue-800',
                        restaurant: 'bg-red-100 text-red-800',
                        activities: 'bg-green-100 text-green-800',
                      }[listing.type]
                    }`}
                  >
                    {listing.type}
                  </span>
                </div>

                <AnimatePresence>
                  {hoveredId === listing._id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="rounded-full bg-green-50 p-2 text-green-600 transition-colors hover:bg-green-100"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
