import Image from 'next/image'

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
  name: string
  country: string
}

interface ListingProps {
  listing: {
    name: string
    description_short: string
    description_long: string
    category: string
    eco_features: string[]
    amenities: string[]
    primary_image_url: string
    gallery_images: string[]
    city: City
    location?: Location
    website?: string
    contact_email?: string
    contact_phone?: string
    price_range?: string
    reviews: Review[]
  }
}

export function ListingDetail({ listing }: ListingProps) {
  const averageRating = listing.reviews.length > 0
    ? listing.reviews.reduce((acc, rev) => acc + rev.rating, 0) / listing.reviews.length
    : 0

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="relative h-64 md:h-96">
        <Image
          src={listing.primary_image_url}
          alt={listing.name}
          fill
          className="object-cover"
          priority
        />
      </div>

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
          <h2 className="text-gray-500 dark:text-gray-400">
            {listing.category} in {listing.city.name}, {listing.city.country}
          </h2>
          {listing.price_range && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Price Range: {listing.price_range}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="prose dark:prose-invert max-w-none mb-8">
          <p className="text-lg mb-4">{listing.description_short}</p>
          <div dangerouslySetInnerHTML={{ __html: listing.description_long }} />
        </div>

        {/* Features & Amenities */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Eco Features</h3>
            <ul className="space-y-2">
              {listing.eco_features.map((feature) => (
                <li key={feature} className="flex items-center text-green-700 dark:text-green-400">
                  <span className="mr-2">🌱</span> {feature}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Amenities</h3>
            <ul className="space-y-2">
              {listing.amenities.map((amenity) => (
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
        {listing.reviews.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Reviews</h3>
            <div className="space-y-4">
              {listing.reviews.map((review, index) => (
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
    </article>
  )
}
