import { authOptions } from '@/lib/auth';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiResponseHandler.unauthorized();
    }

    if (session.user.role !== 'admin' && session.user.role !== 'superAdmin') {
      return ApiResponseHandler.forbidden();
    }

    const body = await request.json();
    const { listingId, action } = body;

    if (!listingId || !action) {
      return ApiResponseHandler.error('Missing required fields: listingId and action', 400);
    }

    let result;

    switch (action) {
      case 'publish':
        // Publish a draft listing
        result = await client
          .patch(listingId.replace('drafts.', ''))
          .set({ status: 'published', publishedAt: new Date().toISOString() })
          .commit();
        break;

      case 'flag':
        // Flag a listing for review
        result = await client
          .patch(listingId)
          .set({ flagged: true, flaggedAt: new Date().toISOString(), flaggedBy: session.user.id })
          .commit();
        break;

      case 'reject':
        // Reject a listing
        result = await client
          .patch(listingId)
          .set({ status: 'rejected', rejectedAt: new Date().toISOString(), rejectedBy: session.user.id })
          .commit();
        break;

      case 'delete':
        // Delete a listing
        result = await client.delete(listingId);
        break;

      case 'unflag':
        // Remove flag from listing
        result = await client
          .patch(listingId)
          .unset(['flagged', 'flaggedAt', 'flaggedBy'])
          .commit();
        break;

      default:
        return ApiResponseHandler.error(`Unknown action: ${action}`, 400);
    }

    return ApiResponseHandler.success(
      { result },
      `Listing ${action}ed successfully`
    );
  } catch (error) {
    console.error('Listing action error:', error);
    return ApiResponseHandler.error('Failed to perform listing action', 500);
  }
}
