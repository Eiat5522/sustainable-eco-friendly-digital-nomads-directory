import { unstable_cache } from 'next/cache';
import type { NextRequest } from 'next/server';
import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

interface ListingsDependencies {
  ApiResponseHandler: typeof ApiResponseHandler;
  handleAuthError: typeof handleAuthError;
  requireAuth: typeof requireAuth;
  getCollection: typeof getCollection;
}

type MaybeRequest =
  | Pick<NextRequest, 'url' | 'json'>
  | { url?: string; json?: () => Promise<unknown> };

type ListingPayload = {
  title: string;
  slug: string;
  category: string;
  description: string;
  location: string;
  ecoTags: string[];
  digitalNomadFeatures: string[];
  priceRange?: string;
  website?: string;
  contactPhone?: string;
  contactEmail?: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  payload?: ListingPayload;
};

// MongoDB Collection interface with common methods
interface MongoCollection {
  find: (query: object) => {
    skip: (n: number) => {
      limit: (n: number) => {
        toArray: () => Promise<unknown[]>;
      };
    };
  };
  findOne: (query: object) => Promise<unknown>;
  insertOne: (doc: object) => Promise<{ insertedId?: unknown; _id?: unknown; id?: unknown }>;
  countDocuments: (query: object) => Promise<number>;
}

const DEFAULT_DEPENDENCIES: ListingsDependencies = {
  ApiResponseHandler,
  handleAuthError,
  requireAuth,
  getCollection,
};

function parsePagination(request: MaybeRequest) {
  if (!request || typeof request.url !== 'string') {
    return {
      ok: false as const,
      error: ApiResponseHandler.error('Invalid request', 400),
    };
  }

  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;

  try {
    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');

    if (pageParam !== null) {
      page = Number(pageParam);
    }
    if (limitParam !== null) {
      limit = Number(limitParam);
    }
  } catch {
    return {
      ok: false as const,
      error: ApiResponseHandler.error('Invalid request URL', 400),
    };
  }

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_LIMIT
  ) {
    return {
      ok: false as const,
      error: ApiResponseHandler.error('Invalid pagination parameters', 400),
    };
  }

  return { ok: true as const, page, limit };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(entry => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(entry => entry.length > 0);
}

function validateListingPayload(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Payload must be an object'],
    };
  }

  const raw = body as Record<string, unknown>;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const slug = typeof raw.slug === 'string' ? raw.slug.trim().toLowerCase() : '';
  const category = typeof raw.category === 'string' ? raw.category.trim() : '';
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';
  const location = typeof raw.location === 'string' ? raw.location.trim() : '';
  const ecoTags = toStringArray(raw.ecoTags);
  const digitalNomadFeatures = toStringArray(raw.digitalNomadFeatures);
  const priceRange = typeof raw.priceRange === 'string' ? raw.priceRange.trim() : undefined;
  const website = typeof raw.website === 'string' ? raw.website.trim() : undefined;
  const contactPhone = typeof raw.contactPhone === 'string' ? raw.contactPhone.trim() : undefined;
  const contactEmail = typeof raw.contactEmail === 'string' ? raw.contactEmail.trim() : undefined;

  const errors: string[] = [];

  if (title.length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  if (slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, or hyphens');
  }

  if (category.length === 0) {
    errors.push('Category is required');
  }

  if (description.length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  if (location.length === 0) {
    errors.push('Location is required');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: [],
    payload: {
      title,
      slug,
      category,
      description,
      location,
      ecoTags,
      digitalNomadFeatures,
      priceRange,
      website,
      contactPhone,
      contactEmail,
    },
  };
}

export function createListingsHandlers(overrides: Partial<ListingsDependencies> = {}) {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides } satisfies ListingsDependencies;
  const {
    ApiResponseHandler: ResponseBuilder,
    handleAuthError: onAuthError,
    requireAuth: ensureAuth,
    getCollection: resolveCollection,
  } = dependencies;

  // Only use caching when dependencies are not overridden (i.e., in production, not in tests)
  const useCache = !overrides.getCollection;

  // Fetch listings from database with optional caching
  const fetchListingsData = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;
    const collection = await resolveCollection('listings');
    if (!collection || typeof (collection as MongoCollection).find !== 'function') {
      // Return a special error object that will be detected and properly handled
      return { error: 'Listings collection not available' };
    }

    const cursor = (collection as MongoCollection).find({});
    const listings = await cursor.skip(skip).limit(limit).toArray();
    const total =
      typeof (collection as MongoCollection).countDocuments === 'function'
        ? await (collection as MongoCollection).countDocuments({})
        : listings.length;

    return { listings, total };
  };

  // Cached version - cache for 1 hour (3600 seconds) to improve performance
  const getCachedListings = unstable_cache(fetchListingsData, ['listings-query'], {
    revalidate: 3600,
    tags: ['listings'],
  });

  const GET = async (request: MaybeRequest) => {
    try {
      await ensureAuth();
    } catch (error) {
      return onAuthError(error);
    }

    const pagination = parsePagination(request);
    if (!pagination.ok) {
      return pagination.error;
    }

    const { page, limit } = pagination;

    try {
      // Use cached version in production, direct fetch in tests
      const result = useCache
        ? await getCachedListings(page, limit)
        : await fetchListingsData(page, limit);

      // Handle collection unavailable error
      if ('error' in result && result.error) {
        return ResponseBuilder.error(result.error, 500);
      }

      const { listings, total } = result as { listings: unknown[]; total: number };

      return ResponseBuilder.success({
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        },
      });
    } catch (error) {
      return ResponseBuilder.error('Failed to fetch listings', 500, (error as Error)?.message);
    }
  };

  const POST = async (request: MaybeRequest) => {
    let session;
    try {
      session = await ensureAuth();
    } catch (error) {
      return onAuthError(error);
    }

    const user = session?.user as { id?: string; plan?: string } | undefined;
    if (!user || user.plan !== 'premium') {
      return ResponseBuilder.forbidden();
    }

    if (!request || typeof request.json !== 'function') {
      return ResponseBuilder.error('Request body is required', 400);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return ResponseBuilder.error('Invalid JSON payload', 400);
    }

    const validation = validateListingPayload(rawBody);
    if (!validation.isValid || !validation.payload) {
      return ResponseBuilder.error('Invalid listing data', 400, validation.errors);
    }

    try {
      const collection = await resolveCollection('listings');
      if (!collection || typeof (collection as MongoCollection).findOne !== 'function') {
        return ResponseBuilder.error('Listings collection not available', 500);
      }

      const existing = await (collection as MongoCollection).findOne({
        slug: validation.payload.slug,
      });
      if (existing) {
        return ResponseBuilder.error('Listing with this slug already exists', 409);
      }

      const document = {
        ...validation.payload,
        ownerId: user.id ?? null,
        createdAt: new Date(),
      };

      const insertResult = await (collection as MongoCollection).insertOne(document);
      const insertedId = insertResult?.insertedId ?? insertResult?._id ?? insertResult?.id;

      return ResponseBuilder.success(
        {
          ...validation.payload,
          id: insertedId ?? null,
          ownerId: user.id ?? null,
        },
        'Listing created successfully'
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message === 'Invalid JSON'
          ? 'Invalid JSON payload'
          : 'Failed to create listing';
      const status = message === 'Invalid JSON payload' ? 400 : 500;
      return ResponseBuilder.error(message, status);
    }
  };

  const UNSUPPORTED = async () => ResponseBuilder.error('Method not allowed', 405);

  return { GET, POST, UNSUPPORTED };
}

const handlers = createListingsHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
export const UNSUPPORTED = handlers.UNSUPPORTED;
