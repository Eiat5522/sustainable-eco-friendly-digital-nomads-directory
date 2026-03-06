import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { groq } from 'next-sanity';
import {
  e2eDiscoveryListings,
  getE2EListingsForCategory,
  isE2ERun,
} from '@/data/e2e/discovery-fixtures';
import { type DereferencedSanityListing, transformToSummaryDTO } from '@/lib/dto-transformer';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { ListingSummaryDTO } from '@/types/dto';

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  listingCount: number;
  heroImageUrl?: string;
}

export interface CategoryDetail extends CategorySummary {
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

type RawCategory = {
  _id?: string;
  name?: string;
  slug?: string;
  title?: string;
  description?: string;
  listingCount?: number;
  heroImageUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
};

const CATEGORY_COPY: Record<string, { name: string; title: string; description: string }> = {
  coworking: {
    name: 'Coworking Space',
    title: 'Coworking Space',
    description:
      'Eco-conscious coworking spaces designed for productive and sustainable remote work.',
  },
  cafe: {
    name: 'Cafe',
    title: 'Cafe',
    description:
      'Work-friendly cafes with sustainable practices, reliable connectivity, and thoughtful design.',
  },
  accommodation: {
    name: 'Accommodation',
    title: 'Accommodation',
    description: 'Sustainable accommodations suitable for short and long digital nomad stays.',
  },
  restaurant: {
    name: 'Restaurant',
    title: 'Restaurant',
    description: 'Restaurants focused on local sourcing and responsible low-waste dining.',
  },
  activities: {
    name: 'Activities',
    title: 'Activities',
    description: 'Low-impact activities and experiences that align with sustainable travel values.',
  },
};

function buildE2ECategories(): CategorySummary[] {
  const counts = new Map<string, number>();
  for (const listing of e2eDiscoveryListings) {
    counts.set(listing.category, (counts.get(listing.category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([slug, listingCount]) => {
      const copy = CATEGORY_COPY[slug] ?? {
        name: slug,
        title: slug,
        description: `Explore ${slug} listings.`,
      };
      return {
        id: `category.${slug}`,
        slug,
        listingCount,
        name: copy.name,
        title: copy.title,
        description: copy.description,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

const CATEGORIES_QUERY = groq`*[_type == "category"] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  title,
  description,
  "heroImageUrl": heroImage.asset->url,
  seo,
  "listingCount": count(*[_type == "listing" && moderation.status == "published" && references(^._id)])
}`;

const CATEGORY_BY_SLUG_QUERY = groq`*[_type == "category" && slug.current == $slug][0] {
  _id,
  name,
  "slug": slug.current,
  title,
  description,
  "heroImageUrl": heroImage.asset->url,
  seo,
  "listingCount": count(*[_type == "listing" && moderation.status == "published" && references(^._id)])
}`;

const LISTINGS_BY_CATEGORY_ID_QUERY = groq`*[_type == "listing" && moderation.status == "published" && references($categoryId)] | order(name asc) {
  _id,
  name,
  slug,
  type,
  shortDescription,
  address,
  location,
  website,
  priceRange,
  primaryImage,
  ecoFocusTags[]->{ name },
  digitalNomadFeatures[]->{ name },
  amenities[]->{ name },
  city->{
    _id,
    name,
    country,
    sustainabilityScore,
    highlights,
    slug
  }
}`;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function mapRawCategory(raw: RawCategory): CategorySummary | null {
  if (!raw._id || !raw.name || !raw.slug || !raw.title || !raw.description) {
    return null;
  }

  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    listingCount: isFiniteNumber(raw.listingCount) ? raw.listingCount : 0,
    heroImageUrl: raw.heroImageUrl,
  };
}

function mapRawCategoryDetail(raw: RawCategory): CategoryDetail | null {
  const mapped = mapRawCategory(raw);
  if (!mapped) return null;

  return {
    ...mapped,
    seo: raw.seo,
  };
}

export async function getCategories(): Promise<CategorySummary[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('categories');

  if (isE2ERun()) {
    return buildE2ECategories();
  }

  try {
    const rows = (await client.fetch<RawCategory[]>(CATEGORIES_QUERY)) ?? [];
    return rows
      .map(mapRawCategory)
      .filter((category): category is CategorySummary => category !== null);
  } catch (error) {
    structuredLogger.error('Failed to fetch categories', error, { component: 'categories.dal' });
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryDetail | null> {
  'use cache';
  cacheLife('hours');
  cacheTag('categories', `category:${slug}`);

  if (isE2ERun()) {
    const category = buildE2ECategories().find(item => item.slug === slug);
    return category ? { ...category, seo: undefined } : null;
  }

  try {
    const row = await client.fetch<RawCategory | null>(CATEGORY_BY_SLUG_QUERY, { slug });
    if (!row) return null;
    return mapRawCategoryDetail(row);
  } catch (error) {
    structuredLogger.error('Failed to fetch category by slug', error, {
      component: 'categories.dal',
      slug,
    });
    return null;
  }
}

export async function getCategoryListings(
  categoryId: string,
  categorySlug: string
): Promise<ListingSummaryDTO[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('categories', `category:${categorySlug}`);

  if (isE2ERun()) {
    return getE2EListingsForCategory(categorySlug);
  }

  try {
    const rows =
      (await client.fetch<DereferencedSanityListing[]>(LISTINGS_BY_CATEGORY_ID_QUERY, {
        categoryId,
      })) ?? [];
    return rows.map(transformToSummaryDTO);
  } catch (error) {
    structuredLogger.error('Failed to fetch category listings', error, {
      component: 'categories.dal',
      categoryId,
      categorySlug,
    });
    return [];
  }
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const categories = await getCategories();
  return categories.map(category => category.slug);
}
