"use client";

import Image from 'next/image'
import { useState } from 'react'
import { urlFor } from '@/lib/sanity/image';
import dynamic from 'next/dynamic';

interface Review {
  rating: number
  comment: string
  _createdAt: string
  author: string
}

interface Location {
  lat: number
  lng: number
}

interface City {
  title: string; // Changed from name to title to match Sanity data
  country?: string; 
}

interface ListingProps {
  listing: {
    name: string
    description_short?: string
    description_long?: string
    category?: string
    eco_features?: string[]
    amenities?: string[]
    primaryImage?: any // Or a more specific SanityImage type if available
    galleryImages?: any[]
    city?: City // Make city optional
    location?: Location
    website?: string
    contact_email?: string
    contact_phone?: string
    price_range?: string
    reviews?: any // Temporarily set to any to resolve mismatch. Investigate SanityListing type.
  }
}

// Import MapContainer for SSR-safe map rendering
const MapContainer = dynamic(() => import('../map/MapContainer'), { ssr: false });

export function ListingDetail({ listing }: ListingProps) {
  console.info('ListingDetail rendered', listing)
  // FORTEST: Log the full listing and location for debugging
  console.info('ListingDetail listing:', listing);
  console.info('ListingDetail location:', listing.location);
  // FORTEST: Log the full listing object for debugging
  console.info('ListingDetail FULL listing object:', JSON.stringify(listing, null, 2));
  const reviews = listing.reviews || []
  const [mainImage, setMainImage] = useState(listing.primaryImage)
  const [hoverImage, setHoverImage] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const averageRating = Array.isArray(reviews) && reviews.length > 0
    ? reviews.reduce((acc: number, rev: Review) => acc + rev.rating, 0) / reviews.length
    : 0
  const hasCoords =
    typeof listing.location?.lat === 'number' &&
    typeof listing.location?.lng === 'number';
  if (hasCoords) {
    // FORTEST: Debug log for map rendering
    console.info('Rendering MapContainer with coordinates:', listing.location?.lat, listing.location?.lng);
  } else {
    // FORTEST: Debug log for missing coordinates
    console.warn('ListingDetail: No valid coordinates for map', listing.location);
  }
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Main image display */}
      {listing.galleryImages && listing.galleryImages.length > 0 && (
        <div className="relative h-64 md:h-96 w-full cursor-pointer transition-all duration-300" onClick={() => setLightboxOpen(true)}>
          <Image
            src={
              [hoverImage, mainImage, urlFor(listing.galleryImages[0])?.url(), '/placeholder-city.jpg']
                .find((src) => typeof src === 'string' && src.trim() !== '') as string
            }
            alt={listing.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      {/* Gallery */}
      {listing.galleryImages && listing.galleryImages.length > 0 && (
        <div className="w-full">
          <div className="flex space-x-4 overflow-x-auto p-4 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-100">
            {listing.galleryImages.map((img, idx) => {
              const imgUrl = urlFor(img)?.url() || '/placeholder-city.jpg';
              return (
                <div
                  key={img._key || img.asset?._ref || idx}
                  className={`relative w-24 h-24 flex-shrink-0 cursor-pointer transition-all duration-300 rounded-lg overflow-hidden
                    ${imgUrl === mainImage ? 'ring-2 ring-green-500 ring-offset-2' : 'hover:ring-2 hover:ring-green-400 hover:ring-offset-1'}
                    transform hover:scale-105`}
                  onMouseEnter={() => setHoverImage(imgUrl)}
                  onMouseLeave={() => setHoverImage(null)}
                  onClick={() => setMainImage(imgUrl)}
                  title="Click to set as main image"
                >
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity duration-300" />
                  <Image 
                    src={imgUrl} 
                    alt={`Gallery image ${idx + 1}`} 
                    fill 
                    className="object-cover"
                    sizes="(max-width: 96px) 100vw, 96px"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Content */}
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {listing.name}
          </h1>
          {averageRating > 0 && (
            <div className="flex items-center bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
              <span className="text-green-700 dark:text-green-300 font-medium">
                {averageRating.toFixed(1)} ★
              </span>
            </div>
          )}
        </div>

        <div className="mb-6">
          {listing.category && listing.city && (
            <h2 className="text-gray-500 dark:text-gray-400">
              {listing.category} in {listing.city.title}{listing.city.country ? `, ${listing.city.country}` : ''}
            </h2>
          )}
          {listing.price_range && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Price Range: {listing.price_range}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="prose dark:prose-invert max-w-none mb-8">
          {listing.description_short && <p className="text-lg mb-4">{listing.description_short}</p>}
          {listing.description_long && <div dangerouslySetInnerHTML={{ __html: listing.description_long }} />}
        </div>

        {/* Features & Amenities */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Eco Features</h3>
            <ul className="space-y-2">
              {(listing.eco_features || []).map((feature) => (
                <li key={feature} className="flex items-center text-green-700 dark:text-green-400">
                  <span className="mr-2">🌱</span> {feature}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Amenities</h3>
            <ul className="space-y-2">
              {(listing.amenities || []).map((amenity) => (
                <li key={amenity} className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="mr-2">✓</span> {amenity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
          <div className="space-y-2">
            {listing.website && (
              <p>
                <strong>Website:</strong>{' '}
                <a
                  href={listing.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  {listing.website}
                </a>
              </p>
            )}
            {listing.contact_email && (
              <p>
                <strong>Email:</strong>{' '}
                <a
                  href={`mailto:${listing.contact_email}`}
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  {listing.contact_email}
                </a>
              </p>
            )}
            {listing.contact_phone && (
              <p>
                <strong>Phone:</strong>{' '}
                <a
                  href={`tel:${listing.contact_phone}`}
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  {listing.contact_phone}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Reviews */}
        {(listing.reviews || []).length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Reviews</h3>
            <div className="space-y-4">
              {Array.isArray(listing.reviews) && listing.reviews.map((review: Review, index: number) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{review.author}</span>
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(review._createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setLightboxOpen(false)}>
          <div className="relative w-11/12 md:w-3/4 lg:w-1/2 h-auto">
            <Image 
              src={hoverImage || (listing.primaryImage && (typeof listing.primaryImage === 'object' && 'url' in listing.primaryImage ? listing.primaryImage.url : typeof listing.primaryImage === 'string' ? listing.primaryImage : urlFor(listing.primaryImage)?.url())) || '/placeholder-city.jpg'}
              alt={listing.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 767px) 92vw, (max-width: 1023px) 75vw, 50vw"
            />
          </div>
        </div>
      )}
      {/* Map section: Only render if coordinates are present */}
      {hasCoords ? (
        <div className="w-full h-96 my-6">
          <MapContainer
            listings={[{
              ...listing,
              coordinates: {
                latitude: listing.location?.lat,
                longitude: listing.location?.lng
              }
            }]}
            className="h-full w-full rounded-lg shadow"
          />
        </div>
      ) : (
        <div className="text-red-500 text-center my-6">No valid coordinates for this listing.</div>
      )}
    </article>
  )
}
