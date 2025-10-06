import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { client } from '@/lib/sanity';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  const sessionUser = session?.user as {
    id?: string;
    role?: string;
  } | undefined;

  if (sessionUser?.role !== 'venueOwner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const listings = await client.fetch(
      `*[_type == "listing" && owner._ref == $userId] {
        _id,
        name,
        "city": city->name,
        "status": status
      }`,
      { userId: sessionUser.id }
    );

    return NextResponse.json({ listings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const sessionUser = session?.user as {
    id?: string;
    role?: string;
  } | undefined;

  if (sessionUser?.role !== 'venueOwner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const newListing = {
      _type: 'listing',
      _id: uuidv4(),
      name: data.name,
      slug: {
        _type: 'slug',
        current: data.name.toLowerCase().replace(/\s+/g, '-'),
      },
      shortDescription: data.shortDescription,
      longDescription: data.longDescription,
      type: data.type,
      address: data.address,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      website: data.website,
      owner: {
        _type: 'reference',
        _ref: sessionUser.id,
      },
      city: {
        _type: 'reference',
        _ref: data.city,
      },
      primaryImage: data.primaryImage,
      galleryImages: data.galleryImages,
      ecoFocusTags: data.ecoFocusTags.map((tagId) => ({ _type: 'reference', _ref: tagId, _key: uuidv4() })),
      digitalNomadFeatures: data.digitalNomadFeatures.map((featureId) => ({ _type: 'reference', _ref: featureId, _key: uuidv4() })),
      amenities: data.amenities.map((amenityId) => ({ _type: 'reference', _ref: amenityId, _key: uuidv4() })),
      accommodationDetails: data.accommodationDetails,
      activitiesDetails: data.activitiesDetails,
      cafeDetails: data.cafeDetails,
      coworkingDetails: data.coworkingDetails,
      restaurantDetails: data.restaurantDetails,
      moderation: {
        status: 'draft',
      },
    };

    const result = await client.create(newListing);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}