import { ApiResponseHandler } from '@/utils/api-response';
import { handleAuthError, requireAuth } from '@/utils/auth-helpers';
import { getCollection } from '@/utils/db-helpers';
import { getListingBySlug } from '@/lib/sanity/queries';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Fetch listing from Sanity
    const listing = await getListingBySlug(params.slug);

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
  { params }: { params: { slug: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const listings = await getCollection('listings');

    const listing = await listings.findOne({ slug: params.slug });

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
      { slug: params.slug },
      { $set: updateData }
    );

    return ApiResponseHandler.success(updateData, 'Listing updated successfully');
  } catch (error) {
    return handleAuthError(error as Error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await requireAuth();
    const listings = await getCollection('listings');

    const listing = await listings.findOne({ slug: params.slug });

    if (!listing) {
      return ApiResponseHandler.notFound('Listing');
    }

    // Only owner can delete
    if (listing.ownerId !== session.user.id) {
      return ApiResponseHandler.forbidden();
    }

    await listings.updateOne(
      { slug: params.slug },
      { $set: { status: 'deleted', deletedAt: new Date() } }
    );

    return ApiResponseHandler.success(null, 'Listing deleted successfully');
  } catch (error) {
    return handleAuthError(error as Error);
  }
}
