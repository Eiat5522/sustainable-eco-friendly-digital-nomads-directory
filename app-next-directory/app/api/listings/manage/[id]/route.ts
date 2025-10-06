import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity';

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (sessionUser?.role !== 'venueOwner' || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const listing = await client.fetch(
      `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: params.id, userId: sessionUser.id }
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

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (sessionUser?.role !== 'venueOwner' || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const existingListing = await client.fetch(
      `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: params.id, userId: sessionUser.id }
    );

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const result = await client
      .patch(params.id)
      .set({
        ...data,
        city: {
          _type: 'reference',
          _ref: data.city,
        },
        primaryImage: data.primaryImage,
        galleryImages: data.galleryImages,
        ecoFocusTags: (data.ecoFocusTags || []).map((tagId: string) => ({
          _type: 'reference',
          _ref: tagId,
          _key: uuidv4(),
        })),
        digitalNomadFeatures: (data.digitalNomadFeatures || []).map((featureId: string) => ({
          _type: 'reference',
          _ref: featureId,
          _key: uuidv4(),
        })),
        amenities: (data.amenities || []).map((amenityId: string) => ({
          _type: 'reference',
          _ref: amenityId,
          _key: uuidv4(),
        })),
        accommodationDetails: data.accommodationDetails,
        activitiesDetails: data.activitiesDetails,
        cafeDetails: data.cafeDetails,
        coworkingDetails: data.coworkingDetails,
        restaurantDetails: data.restaurantDetails,
      })
      .commit();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (sessionUser?.role !== 'venueOwner' || !sessionUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existingListing = await client.fetch(
      `*[_type == "listing" && _id == $id && owner._ref == $userId][0]`,
      { id: params.id, userId: sessionUser.id }
      { id: params.id, userId: sessionUser.id }
    );

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    await client.delete(params.id);

    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
