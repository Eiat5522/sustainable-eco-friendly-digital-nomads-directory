import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity';

type RouteContext = { params: { id: string } | Promise<{ id: string }> };

async function resolveParams(params: { id: string } | Promise<{ id: string }>) {
  return await Promise.resolve(params);
}

export async function GET(_request: Request, context: RouteContext) {
  const { params } = context;
  const resolvedParams = await resolveParams(params);
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (sessionUser?.role !== 'venueOwner' || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const listing = await client.fetch(
      `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: resolvedParams.id, userId: sessionUser.id }
    );

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Failed to fetch listing:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { params } = context;
  const resolvedParams = await resolveParams(params);
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (sessionUser?.role !== 'venueOwner' || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const existingListing = await client.fetch(
      `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: resolvedParams.id, userId: sessionUser.id }
    );

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Build an explicit whitelist to avoid persisting unexpected fields from `data`
    const patchPayload: Record<string, unknown> = {};

    // Basic scalar/string fields (whitelist explicitly)
    const allowedScalars = [
      'title',
      'slug',
      'shortDescription',
      'description',
      'website',
      'email',
      'phone',
      'priceRange',
      'status',
      'listingType',
      'isFeatured',
    ];
    for (const key of allowedScalars) {
      if (Object.prototype.hasOwnProperty.call(data, key)) patchPayload[key] = data[key];
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
      if (Object.prototype.hasOwnProperty.call(data, detailKey) && data[detailKey] != null) {
        patchPayload[detailKey] = data[detailKey];
      }
    }

  const result = await client.patch(resolvedParams.id).set(patchPayload).commit();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update listing:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { params } = context;
  const resolvedParams = await resolveParams(params);
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (sessionUser?.role !== 'venueOwner' || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingListing = await client.fetch(
      `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: resolvedParams.id, userId: sessionUser.id }
    );

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

  await client.delete(resolvedParams.id);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete listing:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
