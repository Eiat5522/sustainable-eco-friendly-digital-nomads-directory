import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { client } from '@/lib/sanity/client';
import { structuredLogger } from '@/lib/logger';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

type ListingItem = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: 'published' | 'unpublished' | 'pending' | 'draft';
  createdAt: string;
  updatedAt: string | null;
  city: string | null;
  moderationStatus: 'pending' | 'approved' | 'rejected' | null;
  isFeatured: boolean;
};

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
    const statusFilter = url.searchParams.get('status') || null;
    const typeFilter = url.searchParams.get('type') || null;

    const offset = (page - 1) * limit;

    // Build search query
    let searchCondition = '';
    if (search) {
      searchCondition = `&& (name match "*${search}*" || slug.current match "*${search}*")`;
    }

    let statusCondition = '';
    if (statusFilter && ['published', 'unpublished', 'pending', 'draft'].includes(statusFilter)) {
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

    const [listings, totalCount] = await Promise.all([
      client.fetch<Array<{
        _id: string;
        name?: string;
        slug?: { current: string };
        type?: string;
        status?: 'published' | 'unpublished' | 'pending' | 'draft';
        _createdAt?: string;
        _updatedAt?: string;
        city?: string | null;
        moderationStatus?: 'pending' | 'approved' | 'rejected' | null;
        isFeatured?: boolean;
      }>>(query),
      client.fetch<number>(countQuery)
    ]);

    const listingItems: ListingItem[] = listings.map(listing => ({
      id: listing._id,
      name: listing.name ?? 'Unnamed Listing',
      slug: listing.slug?.current ?? '',
      type: listing.type ?? 'unknown',
      status: listing.status ?? 'draft',
      createdAt: listing._createdAt ?? new Date().toISOString(),
      updatedAt: listing._updatedAt ?? null,
      city: listing.city ?? null,
      moderationStatus: listing.moderationStatus ?? null,
      isFeatured: listing.isFeatured ?? false,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
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
        search: search || null,
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
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const listingId = body?.listingId;
    const action = body?.action as 'suspend' | 'publish' | 'unpublish' | 'feature' | 'unfeature' | undefined;

    if (!listingId || typeof listingId !== 'string') {
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

    await client.patch(listingId).set(updateData).commit();

    return NextResponse.json({ 
      message: 'Listing updated successfully',
      listingId,
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
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const listingId = body?.listingId;

    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    await client.delete(listingId);

    return NextResponse.json({ 
      message: 'Listing deleted successfully',
      listingId,
    });
  } catch (error) {
    structuredLogger.error('Admin listings DELETE error', error, {
      route: '/api/admin/listings',
      method: 'DELETE',
    });
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
