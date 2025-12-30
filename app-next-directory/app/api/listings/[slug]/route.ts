import type { NextRequest } from 'next/server';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity';
import { getListingBySlug } from '@/lib/sanity/queries';
import type { SanityUserQuotaDoc } from '@/types/sanity';
import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';

type RouteContext = { params: Promise<{ slug: string }> };

interface SlugDependencies {
  requireAuth: typeof requireAuth;
  handleAuthError: typeof handleAuthError;
  getCollection: typeof getCollection;
}

const DEFAULT_DEPENDENCIES: SlugDependencies = {
  requireAuth,
  handleAuthError,
  getCollection,
};

export function createSlugHandlers(overrides: Partial<SlugDependencies> = {}) {
  const {
    requireAuth: ensureAuth,
    handleAuthError: onAuthError,
    getCollection: resolveCollection,
  } = {
    ...DEFAULT_DEPENDENCIES,
    ...overrides,
  };

  return {
    GET: async (_request: NextRequest, context: RouteContext) => {
      let slug: string | undefined;
      try {
        ({ slug } = await context.params);
        // Fetch listing from Sanity
        const listing = await getListingBySlug(slug);

        if (!listing) {
          return ApiResponseHandler.notFound('Listing');
        }

        return ApiResponseHandler.success(listing);
      } catch (error) {
        structuredLogger.error('Failed to fetch listing from Sanity', error, {
          component: 'listings-api',
          slug: slug ?? 'unknown',
        });
        return ApiResponseHandler.error('Failed to fetch listing');
      }
    },

    PUT: async (request: NextRequest, context: RouteContext) => {
      try {
        const { slug } = await context.params;
        const session = await ensureAuth();
        const body = await request.json();
        const listings = await resolveCollection('listings');

        type ListingDocument = {
          slug: string;
          ownerId?: string | null;
        };

        const listing = (await listings.findOne({ slug })) as ListingDocument | null;

        if (!listing) {
          return ApiResponseHandler.notFound('Listing');
        }

        // Only owner or admin can update
        const userId = session?.user?.id;
        const userRole = (session?.user as { role?: string })?.role;
        const isAdmin = userRole === 'admin' || userRole === 'superAdmin';

        if (!userId || (listing.ownerId !== userId && !isAdmin)) {
          return ApiResponseHandler.forbidden('You do not have permission to update this listing');
        }

        // Whitelist allowed fields
        const allowedFields = [
          'title',
          'category',
          'description',
          'location',
          'ecoTags',
          'digitalNomadFeatures',
          'priceRange',
          'website',
          'contactPhone',
          'contactEmail',
        ];

        // Admins can also change ownerId
        if (isAdmin) {
          allowedFields.push('ownerId');
        }

        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        for (const field of allowedFields) {
          if (Object.hasOwn(body, field)) {
            updateData[field] = (body as Record<string, unknown>)[field];
          }
        }

        // If ownerId is being changed, check quota for the new owner
        if (isAdmin && updateData.ownerId && updateData.ownerId !== listing.ownerId) {
          const newOwnerId = updateData.ownerId as string;
          const tierMap: Record<string, number> = { free: 1, pro: 5, enterprise: 50 };

          try {
            const ownerDoc = await client.fetch<SanityUserQuotaDoc | null>(
              `*[_type == "user" && (mongodbId == $id || _id == $id)][0]{_id, maxLocations, listingQuotaTier, quotaOverrideByAdmin}`,
              { id: newOwnerId }
            );

            if (!ownerDoc) {
              return ApiResponseHandler.error('Target owner not found', 404);
            }

            const quotaOverride = !!ownerDoc.quotaOverrideByAdmin;
            let effectiveLimit: number | null = null;
            if (ownerDoc.maxLocations != null) {
              effectiveLimit = Number(ownerDoc.maxLocations);
            } else if (ownerDoc.listingQuotaTier) {
              effectiveLimit = tierMap[String(ownerDoc.listingQuotaTier)] ?? null;
            } else {
              effectiveLimit = tierMap.free;
            }

            if (!quotaOverride) {
              if (effectiveLimit != null) {
                const currentCount = await listings.countDocuments({
                  ownerId: newOwnerId,
                });

                if (Number(currentCount) >= Number(effectiveLimit)) {
                  return ApiResponseHandler.error(
                    `Target owner has reached their listing limit (${currentCount}/${effectiveLimit}).`,
                    403
                  );
                }
              }
            }
          } catch (err) {
            structuredLogger.error('Failed to validate owner quota', err, {
              component: 'listings-api',
            });
            return ApiResponseHandler.error('Failed to validate owner quota', 500);
          }
        }

        await listings.updateOne({ slug }, { $set: updateData });

        return ApiResponseHandler.success(updateData, 'Listing updated successfully');
      } catch (error) {
        return onAuthError(error as Error);
      }
    },

    DELETE: async (_request: NextRequest, context: RouteContext) => {
      try {
        const { slug } = await context.params;
        const session = await ensureAuth();
        const listings = await resolveCollection('listings');

        type ListingDocument = {
          slug: string;
          ownerId?: string | null;
        };

        const listing = (await listings.findOne({ slug })) as ListingDocument | null;

        if (!listing) {
          return ApiResponseHandler.notFound('Listing');
        }

        // Only owner can delete
        const userId = session?.user?.id;
        if (!userId || listing.ownerId !== userId) {
          return ApiResponseHandler.forbidden('You do not have permission to delete this listing');
        }

        await listings.updateOne({ slug }, { $set: { status: 'deleted', deletedAt: new Date() } });

        return ApiResponseHandler.success(null, 'Listing deleted successfully');
      } catch (error) {
        return onAuthError(error as Error);
      }
    },
  };
}

const handlers = createSlugHandlers();
export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
