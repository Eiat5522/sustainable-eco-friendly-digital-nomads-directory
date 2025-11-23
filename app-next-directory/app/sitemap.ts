import type { MetadataRoute } from 'next';
import { client } from '@/lib/sanity/client';

interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

type ListingRecord = {
  slug?: string | null;
  _updatedAt?: string | null;
};

type CityRecord = {
  slug?: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

  // Static pages
  const staticPages: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cities`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    // Fetch listings
    const listingsRaw = await client.fetch<ListingRecord[]>(
      `*[_type == "listing"]{
        "slug": slug.current,
        _updatedAt
      }`
    );
    const listings = (Array.isArray(listingsRaw) ? listingsRaw : []).filter(
      (listing): listing is Required<Pick<ListingRecord, 'slug' | '_updatedAt'>> =>
        typeof listing.slug === 'string' &&
        listing.slug.length > 0 &&
        typeof listing._updatedAt === 'string'
    );

    // Fetch cities with slugs
    const citiesRaw = await client.fetch<CityRecord[]>(`*[_type == "city"]{"slug": slug.current}`);
    const cities = (Array.isArray(citiesRaw) ? citiesRaw : [])
      .map(city => city?.slug)
      .filter((value): value is string => typeof value === 'string' && value.length > 0);

    // Listing pages
    const listingPages: SitemapEntry[] = listings.map(listing => ({
      url: `${baseUrl}/listings/${listing.slug}`,
      lastModified: listing._updatedAt ? new Date(listing._updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // City pages - using the correct /cities/ path with slugs
    const cityPages: SitemapEntry[] = cities.map(slug => ({
      url: `${baseUrl}/cities/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...staticPages, ...listingPages, ...cityPages];
  } catch (_error) {
    // Fallback to static pages only if any error occurs
    return staticPages;
  }
}
