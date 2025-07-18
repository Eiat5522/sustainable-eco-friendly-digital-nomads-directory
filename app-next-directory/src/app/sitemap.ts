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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'

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
    const listings = await client.fetch<{ slug: string, _updatedAt: string }[]>(
      `*[_type == "listing"]{
        "slug": slug.current,
        _updatedAt
      }`
    ) || [];

    // Fetch categories
    const categories = await client.fetch<{ category: string }[]>(
      `*[_type == "listing"]{category} | unique`
    ) || [];

    // Fetch cities
    const cities = await client.fetch<{ name: string }[]>(
      `*[_type == "city"]{name}`
    ) || [];

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
