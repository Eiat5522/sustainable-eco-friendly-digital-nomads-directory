import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

interface Listing {
  _id: string
  name: string
  slug: string
  description_short: string
  primary_image_url: string
  category: string
  city: {
    name: string
    country: string
  }
  eco_features: string[]
}

interface RelatedListingsProps {
  currentListing: Listing
  allListings: Listing[]
  maxListings?: number
}

export function RelatedListings({ currentListing, allListings, maxListings = 3 }: RelatedListingsProps) {
  const router = useRouter()

  const relatedListings = useMemo(() => {
    // Filter out current listing
    const otherListings = allListings.filter(listing => listing._id !== currentListing._id)

    // Calculate relevance scores
    const scoredListings = otherListings.map(listing => {
      let score = 0

      // Same category
      if (listing.category === currentListing.category) score += 3

      // Same city
      if (listing.city.name === currentListing.city.name) score += 2

      // Shared eco features
      const sharedFeatures = listing.eco_features.filter(feature =>
        currentListing.eco_features.includes(feature)
      )
      score += sharedFeatures.length

      return { listing, score }
    })

    // Sort by score and take top N
    return scoredListings
      .sort((a, b) => b.score - a.score)
      .slice(0, maxListings)
      .map(item => item.listing)
  }, [currentListing, allListings, maxListings])

  if (relatedListings.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Similar Eco-Friendly Spaces</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedListings.map((listing) => (
          <Link
            key={listing._id}
            href={`/listings/${listing.slug}`}
            className="group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg">
              <div className="relative h-48">
                <Image
                  src={listing.primary_image_url}
                  alt={listing.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {listing.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {listing.city.name}, {listing.category}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {listing.description_short}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
