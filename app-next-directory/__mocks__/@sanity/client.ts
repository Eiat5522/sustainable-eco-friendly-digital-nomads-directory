import { jest } from '@jest/globals'
import {
  createTestData,
  getListingBySlug,
  getFavoritesForUser,
  listCities,
  listEcoTags
} from '@/tests/helpers/test-data'

const data = createTestData()

const mapListingToSanity = (slug: string | undefined) => {
  if (!slug) return null
  const listing = getListingBySlug(slug)
  if (!listing) return null
  const city = listCities().find((entry) => entry.slug === listing.city.slug?.current)
  return {
    _id: listing._id,
    name: listing.name,
    slug: listing.slug?.current,
    city: city
      ? { _id: city.id, name: city.name, slug: city.slug, country: city.country }
      : { _id: listing.city.slug?.current, name: listing.city.name, slug: listing.city.slug?.current },
    ecoTags: listing.ecoFocusTags.map((tag) => tag.name),
    nomadFeatures: listing.digitalNomadFeatures,
    website: listing.website,
    priceRange: listing.priceRange,
    shortDescription: listing.shortDescription,
    longDescription: listing.longDescription,
    primaryImage: listing.primaryImage,
    galleryImages: listing.galleryImages,
    amenities: []
  }
}

const fetch = jest.fn(async (query: string, params: Record<string, any> = {}) => {
  if (/_type\s*==\s*"userFavorite"/.test(query)) {
    const userId = params.userId ?? data.users[0]?.id
    const favorites = getFavoritesForUser(userId)
    return favorites.map((favorite) => {
      const listing = data.listings.find((item) => item._id === favorite.listingId)
      return {
        _id: favorite.id,
        createdAt: favorite.createdAt,
        listing: listing
          ? {
              _id: listing._id,
              name: listing.name,
              slug: listing.slug?.current,
              mainImage: { asset: { url: `https://images.test/listings/${listing.slug?.current}.jpg` } },
              city: { name: listing.city.name }
            }
          : null
      }
    })
  }

  if (/_type=="listing"/.test(query) && /slug\.current\s*==\s*\$slug/.test(query)) {
    const slug = params.slug ?? params.listingSlug ?? null
    return slug ? mapListingToSanity(slug) : null
  }

  if (/_type\s*==\s*"city"/.test(query)) {
    return listCities().map((city) => ({
      _id: city.id,
      title: city.name,
      slug: city.slug,
      country: city.country,
      description: city.description,
      sustainabilityScore: city.sustainabilityScore,
      highlights: city.highlights,
      primaryImage: {
        asset: {
          _ref: `image-city-${city.slug}`,
          _id: `image-city-${city.slug}`,
          url: city.heroImage,
          metadata: {
            dimensions: { width: 1200, height: 800 }
          }
        }
      }
    }))
  }

  if (/_type\s*==\s*"ecoTag"/.test(query)) {
    return listEcoTags().map((tag) => ({
      _id: tag._id,
      name: tag.name,
      slug: tag.slug.current,
      description: tag.description
    }))
  }

  if (/moderation\.featured/.test(query)) {
    return data.listings.map((listing) => ({
      _id: listing._id,
      name: listing.name,
      slug: listing.slug?.current,
      primaryImage: listing.primaryImage,
      galleryImages: listing.galleryImages,
      location: listing.location,
      city: {
        _id: listing.city.slug?.current,
        name: listing.city.name,
        country: listCities().find((city) => city.slug === listing.city.slug?.current)?.country
      },
      priceRange: listing.priceRange
    }))
  }

  return []
})

export const createClient = jest.fn(() => ({
  fetch,
  create: jest.fn().mockResolvedValue({ _id: 'mock-id' }),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(''),
  getDocument: jest.fn().mockResolvedValue({ _id: 'mock-id' })
}))

export default createClient()
