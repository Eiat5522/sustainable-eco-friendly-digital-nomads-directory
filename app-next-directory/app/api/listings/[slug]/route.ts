import type { NextRequest } from 'next/server';
import { structuredLogger } from '@/lib/logger';
import { getListingBySlug } from '@/lib/sanity/queries';
import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
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
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const session = await requireAuth();
    const body = await request.json();
    const listings = await getCollection('listings');

    type ListingDocument = {
      slug: string;
      ownerId?: string | null;
    };

    const listing = (await listings.findOne({ slug })) as ListingDocument | null;

    if (!listing) {
      return ApiResponseHandler.notFound('Listing');
    }

    // Only owner can update
    const userId = session?.user?.id;
    if (!userId || listing.ownerId !== userId) {
      return ApiResponseHandler.forbidden();
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await listings.updateOne({ slug }, { $set: updateData });

    return ApiResponseHandler.success(updateData, 'Listing updated successfully');
  } catch (error) {
    return handleAuthError(error as Error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const session = await requireAuth();
    const listings = await getCollection('listings');

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
      return ApiResponseHandler.forbidden();
    }

    await listings.updateOne({ slug }, { $set: { status: 'deleted', deletedAt: new Date() } });

    return ApiResponseHandler.success(null, 'Listing deleted successfully');
  } catch (error) {
    return handleAuthError(error as Error);
  }
}
