import { NextResponse, Request } from 'next/server';
import { client as sanityClient } from '../../../lib/sanity.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route.js';
import { z } from 'zod';
import clientPromise from '@/lib/mongodb.js';

// Validation schema for new listing
const createListingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cityId: z.string().min(1, 'City is required'),
  category: z.string().min(1, 'Category is required'),
  description_short: z.string().min(10, 'Short description must be at least 10 characters'),
  description_long: z.string().min(50, 'Long description must be at least 50 characters'),
  imageUrl: z.string().url('Valid image URL is required'),
  eco_features: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  slug: z.string().min(1, 'Slug is required'),
});

export async function GET() {
  try {
    const listings = await sanityClient.fetch(
      `*[_type == "listing"]{
        _id,
        name,
        city->{name},
        category,
        description_short,
        "imageUrl": primary_image_url,
        slug
      }`
    );
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user role - only venue owners and admins can create listings
    const userRole = session.user.role;
    if (!['venueOwner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createListingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid listing data',
          errors: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    
    // Create listing in Sanity
    const newListing = await sanityClient.create({
      _type: 'listing',
      name: validatedData.name,
      city: { _type: 'reference', _ref: validatedData.cityId },
      category: validatedData.category,
      description_short: validatedData.description_short,
      description_long: validatedData.description_long,
      primary_image_url: validatedData.imageUrl,
      eco_features: validatedData.eco_features || [],
      amenities: validatedData.amenities || [],
      slug: {
        _type: 'slug',
        current: validatedData.slug
      },
      owner: {
        _type: 'reference',
        _ref: session.user.id
      },
      status: 'draft',
      created_at: new Date().toISOString()
    });

    // Rate limiting - store creation timestamp
    const client = await clientPromise;
    const db = client.db();
    await db.collection('listingCreations').insertOne({
      userId: session.user.id,
      listingId: newListing._id,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true, 
      message: 'Listing created successfully',
      listing: newListing
    });
  } catch (error) {
    console.error('Error creating listing:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid listing data',
          errors: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
