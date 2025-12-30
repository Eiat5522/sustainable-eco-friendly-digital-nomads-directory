import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity';
import { toSlug } from '@/lib/utils/slug';
import type { UserRole } from '@/types/auth';
import { isListingTypeValue } from '@/types/listings';
import type { SanityUserQuotaDoc } from '@/types/sanity';

type SessionUser = { id?: string; role?: UserRole } | undefined;

function getRoleContext(sessionUser: SessionUser) {
  const role = sessionUser?.role;
  return {
    role,
    isAdmin: role === 'admin' || role === 'superAdmin',
    isVenueOwner: role === 'venueOwner',
  };
}

export async function GET(request: Request) {
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
  const { isAdmin, isVenueOwner } = getRoleContext(sessionUser);

  if (!sessionUser?.id || (!isAdmin && !isVenueOwner)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const query = isAdmin
      ? `*[_type == "listing"] | order(_createdAt desc) {
          _id,
          name,
          "city": city->name,
          "status": coalesce(adminWorkflow.status, moderation.status, "draft"),
          "moderationStatus": moderation.status
        }`
      : `*[_type == "listing" && owner._ref == $userId] | order(_createdAt desc) {
          _id,
          name,
          "city": city->name,
          "status": coalesce(adminWorkflow.status, moderation.status, "draft"),
          "moderationStatus": moderation.status
        }`;

    const listings = await client.fetch(query, { userId: sessionUser.id });

    return NextResponse.json({ listings });
  } catch (error) {
    structuredLogger.error('Failed to fetch managed listings', error, {
      component: 'listings-manage-api',
    });
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
  const { isAdmin, isVenueOwner } = getRoleContext(sessionUser);

  if (!sessionUser?.id || (!isAdmin && !isVenueOwner)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = (await request.json()) as Record<string, unknown>;
    const name = typeof data?.name === 'string' ? data.name.trim() : '';
    const type = typeof data?.type === 'string' ? data.type.trim() : '';
    const city = typeof data?.city === 'string' ? data.city.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Listing name is required' }, { status: 400 });
    }

    if (!isListingTypeValue(type)) {
      return NextResponse.json({ error: 'Listing type is required' }, { status: 400 });
    }

    if (!city) {
      return NextResponse.json({ error: 'City reference is required' }, { status: 400 });
    }

    const listingId = uuidv4();

    // Quota enforcement: determine target owner and check their effective limit
    const tierMap: Record<string, number> = { free: 1, pro: 5, enterprise: 50 };

    // Determine the owner ref: default to session user; admins may pass `owner` in payload
    const targetOwnerRef = (() => {
      if (isAdmin && typeof data?.owner === 'string' && data.owner) return String(data.owner);
      return String(sessionUser.id);
    })();

    try {
      const ownerDoc = await client.fetch<SanityUserQuotaDoc | null>(
        `*[_type == "user" && _id == $id][0]{_id, maxLocations, listingQuotaTier, quotaOverrideByAdmin}`,
        { id: targetOwnerRef }
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
        effectiveLimit = tierMap.free; // global default
      }

      if (!quotaOverride) {
        if (effectiveLimit != null) {
          const currentCount = await client.fetch<number>(
            `count(*[_type == "listing" && owner._ref == $ownerRef])`,
            { ownerRef: targetOwnerRef }
          );

          if (Number(currentCount) >= Number(effectiveLimit)) {
            return NextResponse.json(
              {
                error: 'quota_exceeded',
                message: `Owner has reached their listing limit (${currentCount}/${effectiveLimit}).`,
                currentCount,
                limit: effectiveLimit,
              },
              { status: 403 }
            );
          }
        }
      }
    } catch (err) {
      structuredLogger.error('Failed to validate owner quota', err, {
        component: 'listings-manage-api',
      });
      return NextResponse.json({ error: 'Failed to validate owner quota' }, { status: 500 });
    }
    const listingPayload: Record<string, unknown> = {
      _id: listingId,
      _type: 'listing',
      name,
      slug: { _type: 'slug', current: toSlug(name) },
      type,
      category: type,
      owner: { _type: 'reference', _ref: targetOwnerRef },
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

    const result = await client.createIfNotExists(listingPayload);

    return NextResponse.json(result);
  } catch (error) {
    structuredLogger.error('Failed to create listing', error, {
      component: 'listings-manage-api',
    });
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
