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

      const resp = ApiResponseHandler.success({
        listings: results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
      return resp ?? {
        listings: results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      const errResp = ApiResponseHandler.error('Failed to fetch listings');
      return errResp ?? { error: 'Failed to fetch listings' };
    }
  }

  async function POST(request: Request) {
    try {
      const session = await requireAuth();

      // Only premium users can create listings
      if ((session.user as any).plan !== 'premium') {
        const forbiddenResp = ApiResponseHandler.forbidden();
        return forbiddenResp ?? { error: 'Forbidden' };
      }

      // Parse and validate request body
      const body = await request.json();
      const validationResult = createListingSchema.safeParse(body);

      if (!validationResult.success) {
        const invalidResp = ApiResponseHandler.error(
          'Invalid listing data',
          400,
          validationResult.error.errors
        );
        return invalidResp ?? {
          error: 'Invalid listing data',
          details: validationResult.error.errors
        };
      }

      const validatedData = validationResult.data;
      const listings = await getCollection('listings');

      // Check for duplicate slug
      const existingListing = await listings.findOne({ slug: validatedData.slug });
      if (existingListing) {
        const dupResp = ApiResponseHandler.error('Listing with this slug already exists', 409);
        return dupResp ?? { error: 'Listing with this slug already exists' };
      }

      const newListing = {
        ...validatedData,
        ownerId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };

      const result = await listings.insertOne(newListing);

      const postResp = ApiResponseHandler.success(
        { id: result.insertedId, ...newListing },
        'Listing created successfully'
      );
      return postResp ?? {
        id: result.insertedId,
        ...newListing,
        message: 'Listing created successfully'
      };
    } catch (error) {
      const authErrResp = handleAuthError(error as Error);
      return authErrResp ?? { error: 'Authentication error' };
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
