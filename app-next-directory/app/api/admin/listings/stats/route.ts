import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDefaultTimeout, RequestTimeoutError, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

type ListingStats = {
  totalListings: number;
  publishedListings: number;
  unpublishedListings: number;
  pendingListings: number;
  draftListings: number;
  featuredListings: number;
  listingsByType: Record<string, number>;
};

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export async function GET(request: NextRequest, _context: RouteContext) {
  try {
    // FORTEST: guard for prerender - handle headers() unavailability
    let session: Awaited<ReturnType<typeof auth>> | null = null;
    try {
      session = await auth(request?.headers);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('headers()') || msg.includes('During prerendering')) {
        structuredLogger.warn('[api/admin/listings/stats] headers() unavailable during prerender', error, {
          route: '/api/admin/listings/stats',
        });
        return new Response(null, { status: 204 });
      }
      throw error;
    }
    
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [
      totalCount,
      publishedCount,
      unpublishedCount,
      pendingCount,
      draftCount,
      featuredCount,
      typesCounts,
    ] = await withRequestTimeout(
      Promise.all([
        client.fetch<number>('count(*[_type == "listing"])'),
        client.fetch<number>('count(*[_type == "listing" && adminWorkflow.status == "published"])'),
        client.fetch<number>(
          'count(*[_type == "listing" && adminWorkflow.status == "unpublished"])'
        ),
        client.fetch<number>('count(*[_type == "listing" && adminWorkflow.status == "pending"])'),
        client.fetch<number>(
          'count(*[_type == "listing" && (!defined(adminWorkflow.status) || adminWorkflow.status == "draft")])'
        ),
        client.fetch<number>('count(*[_type == "listing" && adminWorkflow.isFeatured == true])'),
        client.fetch<Array<{ type: string; count: number }>>(
          `*[_type == "listing"] | order(type) {
            type
          } | {
            "type": type,
            "count": count(*[_type == "listing" && type == ^.type])
          } | order(type)`
        ),
      ]),
      getDefaultTimeout(),
      'Fetching listing statistics timed out'
    );

    // Deduplicate and aggregate type counts
    const listingsByType: Record<string, number> = {};
    const seenTypes = new Set<string>();

    for (const item of typesCounts) {
      if (item.type && !seenTypes.has(item.type)) {
        seenTypes.add(item.type);
        listingsByType[item.type] = item.count ?? 0;
      }
    }

    const stats: ListingStats = {
      totalListings: totalCount ?? 0,
      publishedListings: publishedCount ?? 0,
      unpublishedListings: unpublishedCount ?? 0,
      pendingListings: pendingCount ?? 0,
      draftListings: draftCount ?? 0,
      featuredListings: featuredCount ?? 0,
      listingsByType,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const isTimeout = error instanceof RequestTimeoutError;
    structuredLogger.error('Admin listings stats GET error', error, {
      route: '/api/admin/listings/stats',
      method: 'GET',
      errorType: error instanceof Error ? error.name : 'UnknownError',
    });
    if (isTimeout) {
      return NextResponse.json({ error: 'Listing statistics request timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Failed to fetch listing statistics' }, { status: 500 });
  }
}
