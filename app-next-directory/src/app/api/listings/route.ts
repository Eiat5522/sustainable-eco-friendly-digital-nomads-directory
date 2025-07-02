import { z } from 'zod';

/**
 * Factory to create GET and POST handlers with injected dependencies.
 */
export function createListingsHandlers({
  ApiResponseHandler,
  handleAuthError,
  requireAuth,
  getCollection,
}: {
  ApiResponseHandler: any;
  handleAuthError: (err: Error) => Response;
  requireAuth: () => Promise<any>;
  getCollection: (name: string) => Promise<any>;
}) {
  async function GET(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const category = searchParams.get('category');
      const featured = searchParams.get('featured') === 'true';
      const location = searchParams.get('location');

      const listings = await getCollection('listings');

      const filter: any = { status: 'active' };
      if (category) filter.category = category;
      if (location) filter.location = { $regex: location, $options: 'i' };
      if (featured) filter['moderation.featured'] = true;

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

  async function POST(request: Request) {
    try {
      const session = await requireAuth();

      // Only premium users can create listings
      if ((session.user as any).plan !== 'premium') {
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

  return { GET, POST };
}

// Default exports for Next.js API routes (using real dependencies)
import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';

const { GET, POST } = createListingsHandlers({
  ApiResponseHandler,
  handleAuthError,
  requireAuth,
  getCollection,
});

export { GET, POST };

// Add schema for listing creation
const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  category: z.string().min(1),
  location: z.string().min(1),
  // Add/adjust fields as needed for your model
  // e.g. price: z.number().optional(),
  // images: z.array(z.string().url()).optional(),
  // moderation: z.object({ featured: z.boolean() }).optional(),
});
