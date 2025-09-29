import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';
import { getListingBySlug } from '@/lib/sanity/queries';
import type { NextRequest } from 'next/server';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    // Fetch listing from Sanity
    const listing = await getListingBySlug(slug);

    if (!listing) {
      return ApiResponseHandler.notFound('Listing');
    }

    return ApiResponseHandler.success(listing);
  } catch (error) {
    console.error('Failed to fetch listing from Sanity:', error);
    return ApiResponseHandler.error('Failed to fetch listing');
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const session = await requireAuth();
    const body = await request.json();
    const listings = await getCollection('listings');

    const listing = await listings.findOne({ slug });

    if (!listing) {
      return ApiResponseHandler.notFound('Listing');
    }

    // Only owner can update
    if (listing.ownerId !== session.user.id) {
      return ApiResponseHandler.forbidden();
    }

    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    await listings.updateOne(
      { slug },
      { $set: updateData }
    );

    return ApiResponseHandler.success(updateData, 'Listing updated successfully');
  } catch (error) {
    return handleAuthError(error as Error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    const session = await requireAuth();
    const listings = await getCollection('listings');

    const listing = await listings.findOne({ slug });

    if (!listing) {
      return ApiResponseHandler.notFound('Listing');
    }

    // Only owner can delete
    if (listing.ownerId !== session.user.id) {
      return ApiResponseHandler.forbidden();
    }

    await listings.updateOne(
      { slug },
      { $set: { status: 'deleted', deletedAt: new Date() } }
    );

    return ApiResponseHandler.success(null, 'Listing deleted successfully');
  } catch (error) {
    return handleAuthError(error as Error);
  }
}
