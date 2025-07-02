import { ApiResponseHandler } from '@/utils/api-response';

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

      const listings = await getCollection('listings');

      const skip = (page - 1) * limit;

      const [results, total] = await Promise.all([
        listings.find({}).skip(skip).limit(limit).toArray(),
        listings.countDocuments(),
      ]);

      const resp = ApiResponseHandler.success({
        listings: results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
      return resp ?? {
        listings: results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      const errResp = ApiResponseHandler.error('Failed to fetch listings');
      return errResp ?? { error: 'Failed to fetch listings' };
    }
  }

  async function POST(request: Request) {
    let user;
    try {
      const auth = await requireAuth();
      user = auth.user;
    } catch (err) {
      return handleAuthError(err as Error);
    }

    if (!user || user.plan !== 'premium') {
      return ApiResponseHandler.forbidden();
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return ApiResponseHandler.error('Invalid JSON', 400);
    }

    const errors = validateListingData(data);
    if (errors.length > 0) {
      return ApiResponseHandler.error('Invalid listing data', 400, errors);
    }

    const listings = await getCollection('listings');
    const existingListing = await listings.findOne({ slug: data.slug });
    if (existingListing) {
      return ApiResponseHandler.error('Listing with this slug already exists', 409);
    }

    const newListing = {
      ...data,
      ownerId: user.id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await listings.insertOne(newListing);

    const postResp = ApiResponseHandler.success(
      {
        id: result.insertedId,
        ...newListing,
      },
      'Listing created successfully'
    );
    return postResp ?? {
      id: result.insertedId,
      ...newListing,
      message: 'Listing created successfully',
    };
  }

  return { GET, POST };
}

// Default exports for Next.js API routes (using real dependencies)
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';

const { GET, POST } = createListingsHandlers({
  ApiResponseHandler,
  handleAuthError,
  requireAuth,
  getCollection,
});

export { GET, POST };

// --- Validation helper ---
function validateListingData(data: any) {
  const errors: string[] = [];
  if (!data.title || typeof data.title !== 'string' || data.title.length < 3) {
    errors.push('Title must be at least 3 characters.');
  }
  if (!data.description || typeof data.description !== 'string' || data.description.length < 10) {
    errors.push('Description must be at least 10 characters.');
  }
  if (!data.slug || typeof data.slug !== 'string' || !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push('Slug is required and must be URL-friendly.');
  }
  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required.');
  }
  if (!data.location || typeof data.location !== 'string') {
    errors.push('Location is required.');
  }
  return errors;
}
  // images: z.array(z.string().url()).optional(),
  // moderation: z.object({ featured: z.boolean() }).optional(),

