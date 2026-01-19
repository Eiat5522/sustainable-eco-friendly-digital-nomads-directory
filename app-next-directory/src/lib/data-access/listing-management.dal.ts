/**
 * Listing management DAL
 *
 * Handles create/update/read operations for managed listings.
 */

import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity';
import { toSlug } from '@/lib/utils/slug';
import type { UserRole } from '@/types/auth';
import { isListingTypeValue } from '@/types/listings';
import type { SanityListingOwnerDocument, SanityUserQuotaDoc } from '@/types/sanity';

export type ManagedListingUser = {
  id: string;
  role: UserRole;
};

type ListingReference = { _ref?: string; _key?: string };
type ListingWithRefs = SanityListingOwnerDocument & {
  ecoFocusTags?: ListingReference[] | null;
  digitalNomadFeatures?: ListingReference[] | null;
  amenities?: ListingReference[] | null;
};

const tierMap: Record<string, number> = { free: 1, pro: 5, enterprise: 50 };

function getRoleContext(role: UserRole | undefined) {
  return {
    role,
    isAdmin: role === 'admin' || role === 'superAdmin',
    isVenueOwner: role === 'venueOwner',
  };
}

function resolveOwnerRef(
  data: Record<string, unknown>,
  user: ManagedListingUser,
  isAdmin: boolean
): string {
  if (isAdmin && typeof data.owner === 'string' && data.owner) {
    return String(data.owner);
  }
  return user.id;
}

function buildRefKeyMap(entries: ListingReference[] | null | undefined) {
  const map = new Map<string, string>();
  for (const entry of entries ?? []) {
    if (entry && typeof entry._ref === 'string' && typeof entry._key === 'string') {
      map.set(entry._ref, entry._key);
    }
  }
  return map;
}

function mapRefsWithKeys(refs: unknown[], existing: Map<string, string>) {
  return refs.map(ref => {
    const refId = String(ref);
    return {
      _type: 'reference',
      _ref: refId,
      _key: existing.get(refId) ?? uuidv4(),
    };
  });
}

async function enforceOwnerQuota(ownerRef: string) {
  const ownerDoc = await client.fetch<SanityUserQuotaDoc | null>(
    `*[_type == "user" && _id == $id][0]{_id, maxLocations, listingQuotaTier, quotaOverrideByAdmin}`,
    { id: ownerRef }
  );

  if (!ownerDoc) {
    throw new Error('Target owner not found');
  }

  const quotaOverride = Boolean(ownerDoc.quotaOverrideByAdmin);
  if (quotaOverride) {
    return;
  }

  let effectiveLimit: number | null = null;
  if (ownerDoc.maxLocations != null) {
    effectiveLimit = Number(ownerDoc.maxLocations);
  } else if (ownerDoc.listingQuotaTier) {
    effectiveLimit = tierMap[String(ownerDoc.listingQuotaTier)] ?? null;
  } else {
    effectiveLimit = tierMap.free ?? null;
  }

  if (effectiveLimit != null) {
    const currentCount = await client.fetch<number>(
      `count(*[_type == "listing" && owner._ref == $ownerRef])`,
      { ownerRef }
    );

    if (Number(currentCount) >= Number(effectiveLimit)) {
      throw new Error(`Owner has reached their listing limit (${currentCount}/${effectiveLimit}).`);
    }
  }
}

export async function getManagedListingForEdit(
  listingId: string,
  user: ManagedListingUser
): Promise<Record<string, unknown> | null> {
  'use cache: private';
  cacheLife({ stale: 60, expire: 300 });
  cacheTag(`managed-listing-${listingId}`, `managed-listing-user-${user.id}`);

  const { isAdmin, isVenueOwner } = getRoleContext(user.role);
  if (!isAdmin && !isVenueOwner) {
    return null;
  }

  try {
    const query = isAdmin
      ? `*[_type == "listing" && _id == $id][0]`
      : `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`;
    return await client.fetch(query, { id: listingId, userId: user.id });
  } catch (error) {
    structuredLogger.error('Failed to fetch managed listing', error, {
      component: 'listing-management.dal',
      listingId,
    });
    return null;
  }
}

export async function createManagedListing(
  data: Record<string, unknown>,
  user: ManagedListingUser
) {
  const { isAdmin, isVenueOwner } = getRoleContext(user.role);
  if (!isAdmin && !isVenueOwner) {
    throw new Error('Unauthorized');
  }

  const name = typeof data?.name === 'string' ? data.name.trim() : '';
  const type = typeof data?.type === 'string' ? data.type.trim() : '';
  const city = typeof data?.city === 'string' ? data.city.trim() : '';

  if (!name) {
    throw new Error('Listing name is required');
  }

  if (!isListingTypeValue(type)) {
    throw new Error('Listing type is required');
  }

  if (!city) {
    throw new Error('City reference is required');
  }

  const ownerRef = resolveOwnerRef(data, user, isAdmin);

  try {
    await enforceOwnerQuota(ownerRef);
  } catch (error) {
    structuredLogger.error('Failed to validate owner quota', error, {
      component: 'listing-management.dal',
    });
    throw error;
  }

  const listingId = uuidv4();
  const baseSlug = toSlug(name);
  const slug = `${baseSlug}-${listingId.slice(0, 8)}`;

  const listingPayload: Record<string, unknown> = {
    _id: listingId,
    _type: 'listing',
    name,
    slug: { _type: 'slug', current: slug },
    type,
    category: type,
    owner: { _type: 'reference', _ref: ownerRef },
    city: { _type: 'reference', _ref: city },
  };

  const allowedScalars = [
    'shortDescription',
    'longDescription',
    'address',
    'contactPhone',
    'contactEmail',
    'website',
    'priceRange',
  ];
  for (const key of allowedScalars) {
    if (Object.hasOwn(data, key)) listingPayload[key] = data[key];
  }

  if (data.primaryImage !== undefined) listingPayload.primaryImage = data.primaryImage;
  if (Array.isArray(data.galleryImages)) listingPayload.galleryImages = data.galleryImages;

  if (Array.isArray(data.ecoFocusTags)) {
    listingPayload.ecoFocusTags = data.ecoFocusTags.map((tagId: string) => ({
      _type: 'reference',
      _ref: String(tagId),
      _key: uuidv4(),
    }));
  }

  if (Array.isArray(data.digitalNomadFeatures)) {
    listingPayload.digitalNomadFeatures = data.digitalNomadFeatures.map((featureId: string) => ({
      _type: 'reference',
      _ref: String(featureId),
      _key: uuidv4(),
    }));
  }

  if (Array.isArray(data.amenities)) {
    listingPayload.amenities = data.amenities.map((amenityId: string) => ({
      _type: 'reference',
      _ref: String(amenityId),
      _key: uuidv4(),
    }));
  }

  const allowedDetails = [
    'accommodationDetails',
    'activitiesDetails',
    'cafeDetails',
    'coworkingDetails',
    'restaurantDetails',
  ];
  for (const detailKey of allowedDetails) {
    if (Object.hasOwn(data, detailKey) && data[detailKey] != null) {
      listingPayload[detailKey] = data[detailKey];
    }
  }

  return await client.createIfNotExists(listingPayload);
}

export async function updateManagedListing(
  listingId: string,
  data: Record<string, unknown>,
  user: ManagedListingUser
) {
  const { isAdmin, isVenueOwner } = getRoleContext(user.role);
  if (!isAdmin && !isVenueOwner) {
    throw new Error('Unauthorized');
  }

  const existingListing = await client.fetch<ListingWithRefs | null>(
    isAdmin
      ? `*[_type == "listing" && _id == $id][0]`
      : `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
    { id: listingId, userId: user.id }
  );

  if (!existingListing) {
    throw new Error('Listing not found');
  }

  const ecoTagKeys = buildRefKeyMap(existingListing.ecoFocusTags);
  const digitalNomadFeatureKeys = buildRefKeyMap(existingListing.digitalNomadFeatures);
  const amenityKeys = buildRefKeyMap(existingListing.amenities);

  const patchPayload: Record<string, unknown> = {};

  const allowedScalars = [
    'name',
    'shortDescription',
    'longDescription',
    'type',
    'address',
    'contactPhone',
    'contactEmail',
    'website',
    'priceRange',
  ];
  for (const key of allowedScalars) {
    if (Object.hasOwn(data, key)) {
      if (key === 'type' && !isListingTypeValue(data[key] as string)) {
        throw new Error('Invalid listing type');
      }
      patchPayload[key] = data[key];
    }
  }

  if (Object.hasOwn(data, 'type') && !isListingTypeValue(data.type as string)) {
    throw new Error('Invalid listing type');
  }

  if (Object.hasOwn(data, 'type')) {
    patchPayload.category = data.type;
  }

  if (data.city) {
    if (typeof data.city !== 'string') {
      throw new Error('Invalid city reference');
    }
    patchPayload.city = { _type: 'reference', _ref: String(data.city) };
  }

  if (data.primaryImage !== undefined) patchPayload.primaryImage = data.primaryImage;
  if (Array.isArray(data.galleryImages)) patchPayload.galleryImages = data.galleryImages;

  if (Array.isArray(data.ecoFocusTags)) {
    patchPayload.ecoFocusTags = mapRefsWithKeys(data.ecoFocusTags, ecoTagKeys);
  }

  if (Array.isArray(data.digitalNomadFeatures)) {
    patchPayload.digitalNomadFeatures = mapRefsWithKeys(
      data.digitalNomadFeatures,
      digitalNomadFeatureKeys
    );
  }

  if (Array.isArray(data.amenities)) {
    patchPayload.amenities = mapRefsWithKeys(data.amenities, amenityKeys);
  }

  const allowedDetails = [
    'accommodationDetails',
    'activitiesDetails',
    'cafeDetails',
    'coworkingDetails',
    'restaurantDetails',
  ];
  for (const detailKey of allowedDetails) {
    if (Object.hasOwn(data, detailKey) && data[detailKey] != null) {
      patchPayload[detailKey] = data[detailKey];
    }
  }

  return await client.patch(listingId).set(patchPayload).commit();
}
