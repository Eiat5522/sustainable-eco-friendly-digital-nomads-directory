import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { client } from '@/lib/sanity/client';
import { getDefaultTimeout, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
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
  const status = isListingWorkflowStatus(listing.status) ? listing.status : ('draft' as ListingWorkflowStatus);
  const moderationStatus = isListingModerationState(listing.moderationStatus) ? listing.moderationStatus : null;
  const type = isListingTypeValue(listing.type) ? listing.type : 'unknown';

  // Warn if _createdAt is missing
  let createdAt = listing._createdAt;
  if (!createdAt) {
    structuredLogger.warn('Missing _createdAt for listing', { listingId: listing._id });
    createdAt = new Date(0).toISOString(); // Use epoch as sentinel
  }

  return {
    id: listing._id,
    name: listing.name ?? 'Unnamed Listing',
    slug: listing.slug?.current ?? '',
    type,
    status,
    createdAt,
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
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') as string, 10) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get('limit') as string, 10) || 20));
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
    // statusFilter is already validated by isListingWorkflowStatus at line 71
    if (statusFilter) {
      statusCondition = `&& adminWorkflow.status == "${statusFilter}"`;
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
      "status": coalesce(adminWorkflow.status, "draft"),
      _createdAt,
      _updatedAt,
      "city": city->.name,
      moderationStatus,
      "isFeatured": coalesce(adminWorkflow.isFeatured, false)
    }`;

    const countQuery = `count(*[_type == "listing" ${searchCondition} ${statusCondition} ${typeCondition}])`;

    const [listings, totalCount] = await withRequestTimeout(
      Promise.all([
        client.fetch<AdminListingProjection[]>(query),
        client.fetch<number>(countQuery)
      ]),
      getDefaultTimeout(),
      'Fetching admin listings timed out'
    );

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
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const listingId = body?.listingId;
    listingIdValue = typeof listingId === 'string' ? listingId : undefined;
    const action = body?.action as 'suspend' | 'publish' | 'unpublish' | 'feature' | 'unfeature' | undefined;

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
    const session = await auth();
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
      client.delete(listingIdValue),
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
