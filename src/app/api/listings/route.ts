import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';
import { NextRequest } from 'next/server';
import { z } from 'zod';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const location = searchParams.get('location');

    const listings = await getCollection('listings');

    const filter: any = { status: 'active' };
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      listings.find(filter).skip(skip).limit(limit).toArray(),
      listings.countDocuments(filter)
    ]);

    return ApiResponseHandler.success({
      listings: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return ApiResponseHandler.error('Failed to fetch listings');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only premium users can create listings
    if (session.user.plan !== 'premium') {
      return ApiResponseHandler.forbidden();
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createListingSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponseHandler.error(
        'Invalid listing data',
        400,
        validationResult.error.errors
      );
    }

    const validatedData = validationResult.data;
    const listings = await getCollection('listings');

    // Check for duplicate slug
    const existingListing = await listings.findOne({ slug: validatedData.slug });
    if (existingListing) {
      return ApiResponseHandler.error('Listing with this slug already exists', 409);
    }

    const newListing = {
      ...validatedData,
      ownerId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const result = await listings.insertOne(newListing);

    return ApiResponseHandler.success(
      { id: result.insertedId, ...newListing },
      'Listing created successfully'
    );
  } catch (error) {
    return handleAuthError(error as Error);
  }
}
