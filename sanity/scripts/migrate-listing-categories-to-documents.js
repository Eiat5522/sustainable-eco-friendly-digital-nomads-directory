#!/usr/bin/env node

import { createClient } from '@sanity/client';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    'Missing Sanity env vars. Required: SANITY_STUDIO_PROJECT_ID or NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_STUDIO_DATASET or NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN or SANITY_TOKEN'
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

const LABELS = {
  coworking: 'Coworking Space',
  cafe: 'Cafe',
  accommodation: 'Accommodation',
  restaurant: 'Restaurant',
  activities: 'Activities',
};

const DEFAULT_DESCRIPTIONS = {
  coworking: 'Eco-conscious coworking spaces designed for productive and sustainable remote work.',
  cafe: 'Work-friendly cafes with sustainable practices, reliable connectivity, and thoughtful design.',
  accommodation: 'Sustainable accommodations suitable for short and long digital nomad stays.',
  restaurant:
    'Restaurants focused on local sourcing, low-waste operations, and responsible dining.',
  activities: 'Low-impact activities and experiences that align with sustainable travel values.',
};

const toSlug = value =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeCategoryValue = value => {
  if (typeof value !== 'string') return null;
  const slug = toSlug(value);
  if (!slug) return null;

  if (slug.includes('cowork')) return 'coworking';
  if (slug.includes('cafe') || slug.includes('coffee')) return 'cafe';
  if (slug.includes('accommodation') || slug.includes('hotel') || slug.includes('hostel')) {
    return 'accommodation';
  }
  if (slug.includes('restaurant') || slug.includes('food')) return 'restaurant';
  if (slug.includes('activities') || slug.includes('activity') || slug.includes('tour')) {
    return 'activities';
  }

  return slug;
};

const categoryDocId = slug => `category.${slug}`;

async function upsertCategoryDocuments(allCategorySlugs) {
  for (const slug of allCategorySlugs) {
    const label = LABELS[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
    await client.createIfNotExists({
      _id: categoryDocId(slug),
      _type: 'category',
      name: label,
      title: label,
      slug: { _type: 'slug', current: slug },
      description:
        DEFAULT_DESCRIPTIONS[slug] || `Explore sustainable ${label.toLowerCase()} options.`,
    });
  }
}

async function migrateListings() {
  const listings = await client.fetch(
    `*[_type == "listing"]{ _id, type, category, "categoryRef": category._ref }`
  );

  const normalizedValues = new Set();

  for (const listing of listings) {
    const preferred =
      normalizeCategoryValue(listing?.type) || normalizeCategoryValue(listing?.category);
    if (preferred) normalizedValues.add(preferred);
  }

  const seededDefaults = Object.keys(LABELS);
  for (const fallback of seededDefaults) normalizedValues.add(fallback);

  const allCategorySlugs = Array.from(normalizedValues);
  await upsertCategoryDocuments(allCategorySlugs);

  let updatedCount = 0;
  for (const listing of listings) {
    const normalized =
      normalizeCategoryValue(listing?.type) || normalizeCategoryValue(listing?.category);
    if (!normalized) continue;

    const refId = categoryDocId(normalized);
    const patch = client.patch(listing._id).set({ category: { _type: 'reference', _ref: refId } });

    if (typeof listing?.type !== 'string') {
      patch.setIfMissing({ type: normalized });
    } else if (listing.type.trim().length === 0) {
      patch.set({ type: normalized });
    }

    await patch.commit();
    updatedCount += 1;
  }

  return { updatedCount, categoryCount: allCategorySlugs.length };
}

migrateListings()
  .then(({ updatedCount, categoryCount }) => {
    console.log(`Created/verified ${categoryCount} category documents.`);
    console.log(`Updated ${updatedCount} listings with category references.`);
  })
  .catch(error => {
    console.error('Category migration failed:', error);
    process.exit(1);
  });
