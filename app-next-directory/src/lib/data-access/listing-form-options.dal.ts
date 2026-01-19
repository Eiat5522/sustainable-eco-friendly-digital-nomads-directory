/**
 * Listing Form Options DAL
 *
 * Centralizes static option fetching for listing forms.
 */

import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { getCitiesList } from '@/lib/data/city';
import { getEcoTags } from '@/lib/data-access/home.dal';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';

type FormOption = { _id: string; name: string };

type OptionsResponse = {
  cities: FormOption[];
  ecoTags: FormOption[];
  digitalNomadFeatures: FormOption[];
  amenities: FormOption[];
};

function toFormOptions(value: unknown): FormOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(entry => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const typedEntry = entry as { _id?: unknown; id?: unknown; name?: unknown };
      const maybeId = typedEntry._id ?? typedEntry.id;
      const maybeName = typedEntry.name;
      if (typeof maybeId === 'string' && typeof maybeName === 'string') {
        return { _id: maybeId, name: maybeName };
      }
      return null;
    })
    .filter((option): option is FormOption => option !== null);
}

async function getDigitalNomadFeatures(): Promise<FormOption[]> {
  'use cache';
  cacheLife('days');
  cacheTag('digital-nomad-features');

  try {
    const features = await client.fetch(
      `*[_type == "nomadFeature"] | order(name asc) { _id, name }`
    );
    return toFormOptions(features);
  } catch (error) {
    structuredLogger.error('Failed to fetch digital nomad features', error, {
      component: 'listing-form-options.dal',
    });
    return [];
  }
}

async function getAmenities(): Promise<FormOption[]> {
  'use cache';
  cacheLife('days');
  cacheTag('amenities');

  try {
    const amenities = await client.fetch(`*[_type == "amenity"] | order(name asc) { _id, name }`);
    return toFormOptions(amenities);
  } catch (error) {
    structuredLogger.error('Failed to fetch amenities', error, {
      component: 'listing-form-options.dal',
    });
    return [];
  }
}

export async function getListingFormOptions(): Promise<OptionsResponse> {
  'use cache';
  cacheLife('days');
  cacheTag('listing-form-options');

  const [cities, ecoTags, digitalNomadFeatures, amenities] = await Promise.all([
    getCitiesList(80),
    getEcoTags(),
    getDigitalNomadFeatures(),
    getAmenities(),
  ]);

  return {
    cities: toFormOptions(cities),
    ecoTags: toFormOptions(ecoTags),
    digitalNomadFeatures,
    amenities,
  };
}
