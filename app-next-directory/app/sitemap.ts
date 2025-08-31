import { client } from '@/lib/sanity/client'
import { MetadataRoute } from 'next'

interface SitemapEntry {
  url: string
  lastModified?: string | Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

// Types for Sanity query responses
interface ListingData {
  slug: string;
  _updatedAt: string;
}

interface CategoryData {
  category: string;
}

interface CityData {
  name: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.nextPublicSiteUrl || 'http://localhost:3001'

  // Static pages
  const staticPages: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/cities`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8
    }
  ]

  try {
    // Fetch listings
    const listingsRaw = await client.fetch(
      `*[_type == "listing"]{
        "slug": slug.current,
        _updatedAt
      }`
    )
    const listings = (Array.isArray(listingsRaw) ? listingsRaw : []) as { slug: string, _updatedAt: string }[]

    // Fetch categories
    const categoriesRaw = await client.fetch(
      `*[_type == "listing"]{category} | unique`
    )
    const categories = (Array.isArray(categoriesRaw) ? categoriesRaw : []) as { category: string }[]

    // Fetch cities
    const citiesRaw = await client.fetch(
      `*[_type == "city"]{name}`
    )
    const cities = (Array.isArray(citiesRaw) ? citiesRaw : []) as { name: string }[]

    // Listing pages
    const listingPages: SitemapEntry[] = listings.map((listing: { slug: string, _updatedAt: string }) => ({
      url: `${baseUrl}/listings/${listing.slug}`,
      lastModified: listing._updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7
    }));

    // Category pages
    const categoryPages: SitemapEntry[] = categories.map((cat: { category: string }) => ({
      url: `${baseUrl}/category/${cat.category?.toLowerCase?.() ?? ''}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6
    }));

    // City pages
    const cityPages: SitemapEntry[] = cities.map((city: { name: string }) => ({
      url: `${baseUrl}/city/${city.name?.toLowerCase?.() ?? ''}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6
    }));

    return [...staticPages, ...listingPages, ...categoryPages, ...cityPages]
  } catch (err) {
    // Fallback to static pages only if any error occurs
    return staticPages
  }
}
