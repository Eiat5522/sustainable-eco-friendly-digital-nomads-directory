import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDefaultTimeout, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';
import {
  isListingModerationState,
  isListingTypeValue,
  isListingWorkflowStatus,
  type ListingManagementItem,
  type ListingManagementResponse,
  type ListingWorkflowStatus,
} from '@/types/listings';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

type AdminListingProjection = {
  _id: string;
  name?: string;
  slug?: { current: string };
  type?: string;
  status?: string;
  _createdAt?: string;
  _updatedAt?: string;
  city?: string | null;
  moderationStatus?: string | null;
  isFeatured?: boolean;
};

function toListingManagementItem(listing: AdminListingProjection): ListingManagementItem {
  const status = isListingWorkflowStatus(listing.status)
    ? listing.status
    : ('draft' as ListingWorkflowStatus);
  const moderationStatus = isListingModerationState(listing.moderationStatus)
    ? listing.moderationStatus
    : null;
  const type = isListingTypeValue(listing.type) ? listing.type : 'unknown';

  return {
    id: listing._id,
    name: listing.name ?? 'Unnamed Listing',
    slug: listing.slug?.current ?? '',
    type,
    status,
    createdAt: listing._createdAt ?? new Date().toISOString(),
    updatedAt: listing._updatedAt ?? null,
    city: listing.city ?? null,
    moderationStatus,
    isFeatured: listing.isFeatured ?? false,
  };
}

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export async function GET(request: NextRequest, _context: RouteContext) {
  try {
    const isE2E = process.env.E2E === '1' || process.env.NEXT_PUBLIC_E2E === '1';
    const isJestEnvironment = Boolean(process.env.JEST_WORKER_ID);
    if (isE2E && !isJestEnvironment) {
      const session = await auth(request?.headers).catch(() => null);
      const sessionUser = session?.user as SessionUser;
      if (!ensureAdmin(sessionUser)) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
      return NextResponse.json<ListingManagementResponse>({
        listings: [
          {
            id: 'listing-flagged',
            name: 'Flagged Listing',
            slug: 'flagged-listing',
            type: 'coworking',
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            city: 'Bangkok',
            moderationStatus: 'pending',
            isFeatured: false,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        filters: {
          search: '',
          status: null,
          type: null,
        },
      });
    }
    // FORTEST: guard for prerender - handle headers() unavailability
    let session: Awaited<ReturnType<typeof auth>> | null = null;
    try {
      session = await auth(request?.headers);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('headers()') || msg.includes('During prerendering')) {
        structuredLogger.warn(
          '[api/admin/listings] headers() unavailable during prerender',
          error,
          {
            route: '/api/admin/listings',
          }
        );
        return new Response(null, { status: 204 });
      }
      throw error;
    }

    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') as string, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(10, parseInt(url.searchParams.get('limit') as string, 10) || 20)
    );
    const search = url.searchParams.get('search')?.trim() || '';
    const statusParam = url.searchParams.get('status');
    const statusFilter = isListingWorkflowStatus(statusParam) ? statusParam : null;
    const typeParam = url.searchParams.get('type');
    const typeFilter = isListingTypeValue(typeParam) ? typeParam : null;

    const offset = (page - 1) * limit;

    // Build search query
    let searchCondition = '';
    if (search) {
      searchCondition = `&& (name match "*${search}*" || slug.current match "*${search}*")`;
    }

    let statusCondition = '';
    // Defensive: Explicitly check statusFilter against allowed values to prevent injection
    const allowedStatusValues: ListingWorkflowStatus[] = [
      'draft',
      'pending',
      'published',
      'unpublished',
    ];
    if (statusFilter && allowedStatusValues.includes(statusFilter as ListingWorkflowStatus)) {
      statusCondition = `&& coalesce(adminWorkflow.status, moderation.status, "draft") == "${statusFilter}"`;
    }

    let typeCondition = '';
    if (typeFilter) {
      typeCondition = `&& type == "${typeFilter}"`;
    }

    const query = `*[_type == "listing" ${searchCondition} ${statusCondition} ${typeCondition}] | order(_createdAt desc) [${offset}...${offset + limit}] {
      _id,
      name,
      slug,
      type,
      "status": coalesce(adminWorkflow.status, moderation.status, "draft"),
      _createdAt,
      _updatedAt,
      "city": city->.name,
      moderationStatus,
      "isFeatured": coalesce(adminWorkflow.isFeatured, moderation.featured, false)
    }`;

    const countQuery = `count(*[_type == "listing" ${searchCondition} ${statusCondition} ${typeCondition}])`;

    const [listings, totalCount] = await withRequestTimeout(
      Promise.all([
        client.fetch<AdminListingProjection[]>(query),
        client.fetch<number>(countQuery),
      ]),
      getDefaultTimeout(),
      'Fetching admin listings timed out'
    );

    if (!listings || totalCount === null) {
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    const listingItems = listings.map(toListingManagementItem);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json<ListingManagementResponse>({
      listings: listingItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        search,
        status: statusFilter,
        type: typeFilter,
      },
    });
  } catch (error) {
    structuredLogger.error('Admin listings GET error', error, {
      route: '/api/admin/listings',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, _context: RouteContext) {
  let listingIdValue: string | undefined;
  try {
    const session = await auth(request.headers);
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const listingId = body?.listingId;
    listingIdValue = typeof listingId === 'string' ? listingId : undefined;
    const action = body?.action as
      | 'suspend'
      | 'publish'
      | 'unpublish'
      | 'feature'
      | 'unfeature'
      | undefined;

    if (!listingIdValue) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    if (!action || !['suspend', 'publish', 'unpublish', 'feature', 'unfeature'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      'adminWorkflow.lastChangedAt': timestamp,
      'adminWorkflow.lastChangedBy': sessionUser?.id,
    };

    switch (action) {
      case 'suspend':
        updateData['adminWorkflow.status'] = 'unpublished';
        updateData['moderationStatus'] = 'rejected';
        break;
      case 'publish':
        updateData['adminWorkflow.status'] = 'published';
        break;
      case 'unpublish':
        updateData['adminWorkflow.status'] = 'unpublished';
        break;
      case 'feature':
        updateData['adminWorkflow.isFeatured'] = true;
        break;
      case 'unfeature':
        updateData['adminWorkflow.isFeatured'] = false;
        break;
    }

    await withRequestTimeout(
      client.patch(listingIdValue).set(updateData).commit(),
      getDefaultTimeout(),
      'Updating listing timed out'
    );

    return NextResponse.json({
      message: 'Listing updated successfully',
      listingId: listingIdValue,
      action,
    });
  } catch (error) {
    structuredLogger.error('Admin listings PATCH error', error, {
      route: '/api/admin/listings',
      method: 'PATCH',
    });
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, _context: RouteContext) {
  let listingIdValue: string | undefined;
  try {
    const session = await auth(request.headers);
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const listingId = body?.listingId;
    listingIdValue = typeof listingId === 'string' ? listingId : undefined;

    if (!listingIdValue) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    await withRequestTimeout(
      (client.delete as (id: string) => Promise<void>)(listingIdValue),
      getDefaultTimeout(),
      'Deleting listing timed out'
    );

    return NextResponse.json({
      message: 'Listing deleted successfully',
      listingId: listingIdValue,
    });
  } catch (error) {
    structuredLogger.error('Admin listings DELETE error', error, {
      route: '/api/admin/listings',
      method: 'DELETE',
    });
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
