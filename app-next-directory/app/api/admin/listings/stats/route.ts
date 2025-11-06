import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { client } from '@/lib/sanity/client';
import { withRequestTimeout, RequestTimeoutError, getDefaultTimeout } from '@/lib/http/request';
import { createRouteError } from '@/lib/error-handler';

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

export async function GET(_request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
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
        client.fetch<number>('count(*[_type == "listing" && adminWorkflow.status == "unpublished"])'),
        client.fetch<number>('count(*[_type == "listing" && adminWorkflow.status == "pending"])'),
        client.fetch<number>('count(*[_type == "listing" && (!defined(adminWorkflow.status) || adminWorkflow.status == "draft")])'),
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
    const status = error instanceof RequestTimeoutError ? 504 : 500;
    return createRouteError(error, { scope: 'api:admin:listings:stats', action: 'GET' }, 'Failed to fetch listing statistics', status);
  }
}
