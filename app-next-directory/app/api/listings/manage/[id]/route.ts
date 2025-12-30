import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity';
import type { UserRole } from '@/types/auth';
import type { SanityListingOwnerDocument, SanityUserQuotaDoc } from '@/types/sanity';

type RouteContext = { params: { id: string } | Promise<{ id: string }> };
type SessionUser = { id?: string; role?: UserRole } | undefined;

async function resolveParams(params: { id: string } | Promise<{ id: string }>) {
  return await Promise.resolve(params);
}

export async function GET(request: Request, context: RouteContext) {
  const { params } = context;
  const resolvedParams = await resolveParams(params);

  // FORTEST: guard for prerender - handle headers() unavailability
  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth(request?.headers);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('headers()') || msg.includes('During prerendering')) {
      structuredLogger.warn('[listings/manage] headers() unavailable during prerender', error, {
        route: '/api/listings/manage',
      });
      return new Response(null, { status: 204 });
    }
    throw error;
  }

  const sessionUser = session?.user as SessionUser;
  const role = sessionUser?.role;
  const isAdmin = role === 'admin' || role === 'superAdmin';
  const isVenueOwner = role === 'venueOwner';

  if (!sessionUser?.id || (!isAdmin && !isVenueOwner)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const query = isAdmin
      ? `*[_type == "listing" && _id == $id][0]`
      : `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`;
    const listing = await client.fetch(query, {
      id: resolvedParams.id,
      userId: sessionUser.id,
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    structuredLogger.error('Failed to fetch listing', error, {
      component: 'listings-manage-api',
      listingId: resolvedParams.id,
    });
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { params } = context;
  const resolvedParams = await resolveParams(params);

  // FORTEST: guard for prerender - handle headers() unavailability
  let session: Awaited<ReturnType<typeof auth>> | null = null;
  try {
    session = await auth(request?.headers);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('headers()') || msg.includes('During prerendering')) {
      structuredLogger.warn('[listings/manage] headers() unavailable during prerender', error, {
        route: '/api/listings/manage',
      });
      return new Response(null, { status: 204 });
    }
    throw error;
  }

  const sessionUser = session?.user as SessionUser;
  const role = sessionUser?.role;
  const isAdmin = role === 'admin' || role === 'superAdmin';
  const isVenueOwner = role === 'venueOwner';

  if (!sessionUser?.id || (!isAdmin && !isVenueOwner)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = (await request.json()) as Record<string, unknown>;
    const existingListing = await client.fetch<SanityListingOwnerDocument | null>(
      isAdmin
        ? `*[_type == "listing" && _id == $id][0]`
        : `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: resolvedParams.id, userId: sessionUser.id }
    );

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Build an explicit whitelist to avoid persisting unexpected fields from `data`
    const patchPayload: Record<string, unknown> = {};

    // Basic scalar/string fields (whitelist explicitly)
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
      if (Object.hasOwn(data, key)) patchPayload[key] = data[key];
    }

    if (Object.hasOwn(data, 'type')) {
      patchPayload.category = data.type;
    }

    // Owner change (admin only)
    let ownerChanged = false;
    let newOwnerId: string | undefined;
    if (isAdmin && data.owner && typeof data.owner === 'string') {
      newOwnerId = data.owner;
      if (newOwnerId !== existingListing.owner?._ref) {
        ownerChanged = true;

        // Quota check for new owner
        const tierMap: Record<string, number> = { free: 1, pro: 5, enterprise: 50 };
        try {
          const ownerDoc = await client.fetch<SanityUserQuotaDoc | null>(
            `*[_type == "user" && _id == $id][0]{_id, maxLocations, listingQuotaTier, quotaOverrideByAdmin}`,
            { id: newOwnerId }
          );

          if (!ownerDoc) {
            return NextResponse.json({ error: 'Target owner not found' }, { status: 404 });
          }

          const quotaOverride = !!ownerDoc.quotaOverrideByAdmin;
          let effectiveLimit: number | null = null;
          if (ownerDoc.maxLocations != null) {
            effectiveLimit = Number(ownerDoc.maxLocations);
          } else if (ownerDoc.listingQuotaTier) {
            effectiveLimit = tierMap[String(ownerDoc.listingQuotaTier)] ?? null;
          } else {
            effectiveLimit = tierMap.free;
          }

          if (!quotaOverride) {
            if (effectiveLimit != null) {
              const currentCount = await client.fetch(
                `count(*[_type == "listing" && owner._ref == $ownerRef])`,
                { ownerRef: newOwnerId }
              );

              if (Number(currentCount) >= Number(effectiveLimit)) {
                return NextResponse.json(
                  {
                    error: 'quota_exceeded',
                    message: `Target owner has reached their listing limit (${currentCount}/${effectiveLimit}).`,
                    currentCount,
                    limit: effectiveLimit,
                  },
                  { status: 403 }
                );
              }
            }
          }
          patchPayload.owner = { _type: 'reference', _ref: newOwnerId };
        } catch (err) {
          structuredLogger.error('Failed to validate owner quota', err, {
            component: 'listings-manage-api',
          });
          return NextResponse.json({ error: 'Failed to validate owner quota' }, { status: 500 });
        }
      }
    }

    // City reference
    if (data.city) {
      if (typeof data.city !== 'string') {
        return NextResponse.json({ error: 'Invalid city reference' }, { status: 400 });
      }
      patchPayload.city = { _type: 'reference', _ref: String(data.city) };
    }

    // Primary and gallery images (copy as provided if present)
    if (data.primaryImage !== undefined) patchPayload.primaryImage = data.primaryImage;
    if (Array.isArray(data.galleryImages)) patchPayload.galleryImages = data.galleryImages;

    // Reference arrays: map only when present and an array
    if (Array.isArray(data.ecoFocusTags)) {
      patchPayload.ecoFocusTags = data.ecoFocusTags.map((tagId: string) => ({
        _type: 'reference',
        _ref: String(tagId),
        _key: uuidv4(),
      }));
    }

    if (Array.isArray(data.digitalNomadFeatures)) {
      patchPayload.digitalNomadFeatures = data.digitalNomadFeatures.map((featureId: string) => ({
        _type: 'reference',
        _ref: String(featureId),
        _key: uuidv4(),
      }));
    }

    if (Array.isArray(data.amenities)) {
      patchPayload.amenities = data.amenities.map((amenityId: string) => ({
        _type: 'reference',
        _ref: String(amenityId),
        _key: uuidv4(),
      }));
    }

    // Known nested detail objects - copy only if present (shallow copy)
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

    const result = await client.patch(resolvedParams.id).set(patchPayload).commit();

    if (ownerChanged && newOwnerId) {
      const entry = {
        _key: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from: existingListing.owner?._ref || null,
        to: newOwnerId,
        actor: sessionUser.id,
        reason: (data.reason as string) || 'Admin update',
        at: new Date().toISOString(),
      };

      try {
        await client.patch(resolvedParams.id).append('ownerHistory', [entry]).commit();
      } catch (historyErr) {
        structuredLogger.error('Failed to append ownerHistory after update', historyErr, {
          listingId: resolvedParams.id,
          entry,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    structuredLogger.error('Failed to update listing', error, {
      component: 'listings-manage-api',
      listingId: resolvedParams.id,
    });
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { params } = context;
  const resolvedParams = await resolveParams(params);
  const session = await auth(request.headers);
  const sessionUser = session?.user as SessionUser;
  const role = sessionUser?.role;
  const isAdmin = role === 'admin' || role === 'superAdmin';
  const isVenueOwner = role === 'venueOwner';

  if (!sessionUser?.id || (!isAdmin && !isVenueOwner)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingListing = await client.fetch(
      isAdmin
        ? `*[_type == "listing" && _id == $id][0]`
        : `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: resolvedParams.id, userId: sessionUser.id }
    );

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    await client.delete(resolvedParams.id);

    return new Response(null, { status: 204 });
  } catch (error) {
    structuredLogger.error('Failed to delete listing', error, {
      component: 'listings-manage-api',
      listingId: resolvedParams.id,
    });
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
