import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';

type SessionUser = { id?: string; plan?: string; [key: string]: unknown };
type AuthSession = { user?: SessionUser } | null;

type ListingRecord = Record<string, unknown>;

interface ListingsCursor {
  skip(amount: number): ListingsCursor;
  limit(amount: number): ListingsCursor;
  toArray(): Promise<ListingRecord[]>;
}

interface ListingsCollection {
  find(query: Record<string, unknown>): ListingsCursor;
  countDocuments(query: Record<string, unknown>): Promise<number>;
  findOne(filter: Record<string, unknown>): Promise<ListingRecord | null>;
  insertOne(document: ListingRecord): Promise<{ insertedId: unknown }>;
}

interface CreateHandlersDeps {
  responseHelper: typeof ApiResponseHandler;
  handleAuthError: (error: unknown) => Response;
  requireAuth: () => Promise<AuthSession>;
  getCollection: (name: string) => Promise<ListingsCollection>;
}

function createListingsHandlers({ responseHelper, handleAuthError, requireAuth, getCollection }: CreateHandlersDeps) {
  async function GET(request: Request) {
    try {
      if (!request || typeof request.url !== 'string') {
        return responseHelper.error('Malformed request', 400);
      }

      const { searchParams } = new URL(request.url);
      const page = Number.parseInt(searchParams.get('page') ?? '1', 10);
      const limit = Number.parseInt(searchParams.get('limit') ?? '10', 10);

      if (!Number.isFinite(page) || !Number.isFinite(limit) || page < 1 || limit < 1) {
        return responseHelper.error('Invalid pagination parameters', 400);
      }

      const listings = await getCollection('listings');
      const skip = (page - 1) * limit;
      const publishedQuery: Record<string, unknown> = {
        $or: [
          { 'moderation.status': 'published' },
          { status: 'published' },
        ],
      };

      const [results, total] = await Promise.all([
        listings.find(publishedQuery).skip(skip).limit(limit).toArray(),
        listings.countDocuments(publishedQuery),
      ]);

      return responseHelper.success({
        listings: results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      return responseHelper.error('Failed to fetch listings');
    }
  }

  async function POST(request: Request) {
    let session: AuthSession;
    try {
      session = await requireAuth();
    } catch (error) {
      return handleAuthError(error);
    }

    const sessionUser = session?.user;
    if (!sessionUser || sessionUser.plan !== 'premium') {
      return responseHelper.forbidden();
    }

    const ownerId = typeof sessionUser.id === 'string' ? sessionUser.id : undefined;
    if (!ownerId) {
      return responseHelper.error('Authenticated user is missing an identifier', 403);
    }

    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return responseHelper.error('Missing or invalid request body', 400);
    }

    const payload = rawBody as ListingRecord;
    const errors = validateListingData(payload);
    if (errors.length > 0) {
      return responseHelper.error('Invalid listing data', 400, errors);
    }

    const listings = await getCollection('listings');
    const slug = typeof payload['slug'] === 'string' ? payload['slug'] : '';
    const existingListing = await listings.findOne({ slug });
    if (existingListing) {
      return responseHelper.error('Listing with this slug already exists', 409);
    }

    const timestamp = new Date();
    const newListing: ListingRecord = {
      ...payload,
      ownerId,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    let insertResult: { insertedId: unknown };
    try {
      insertResult = await listings.insertOne(newListing);
    } catch (error) {
      console.error('Failed to create listing:', error);
      return responseHelper.error('Failed to create listing', 500);
    }

    const insertedId = insertResult.insertedId;
    const id = typeof insertedId === 'string' ? insertedId : insertedId && typeof (insertedId as { toString?: () => string }).toString === 'function'
      ? (insertedId as { toString: () => string }).toString()
      : '';

    return responseHelper.success(
      {
        id,
        ...newListing,
      },
      'Listing created successfully'
    );
  }

  async function UNSUPPORTED() {
    return responseHelper.error('Method Not Allowed', 405);
  }

  return { GET, POST, UNSUPPORTED };
}

export { createListingsHandlers };

const { GET, POST, UNSUPPORTED } = createListingsHandlers({
  responseHelper: ApiResponseHandler,
  handleAuthError,
  requireAuth,
  getCollection: async (name: string) => {
    const collection = await getCollection(name);
    return collection as ListingsCollection;
  },
});

export { GET, POST, UNSUPPORTED };

function validateListingData(data: ListingRecord): Array<{ message: string }> {
  const errors: Array<{ message: string }> = [];

  const title = data['title'];
  if (typeof title !== 'string' || title.trim().length < 3) {
    errors.push({ message: 'Title must be at least 3 characters.' });
  }

  const description = data['description'];
  if (typeof description !== 'string' || description.trim().length < 10) {
    errors.push({ message: 'Description must be at least 10 characters.' });
  }

  const slug = data['slug'];
  if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    errors.push({ message: 'Slug is required and must be URL-friendly.' });
  }

  const category = data['category'];
  if (typeof category !== 'string' || category.trim().length === 0) {
    errors.push({ message: 'Category is required.' });
  }

  const location = data['location'];
  if (typeof location !== 'string' || location.trim().length === 0) {
    errors.push({ message: 'Location is required.' });
  }

  return errors;
}
