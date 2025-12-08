import { type NextRequest, NextResponse } from 'next/server';
import { type BulkOperationType, runBulkOperation } from '@/lib/admin/analytics';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

const OPERATION_DESCRIPTIONS: Record<BulkOperationType, string> = {
  publishListings: 'Set listings to published status and surface in search.',
  unpublishListings: 'Temporarily remove listings from discovery results.',
  featureListings: 'Mark listings as featured for curated placements.',
};

function ensureAdmin(sessionUser: SessionUser) {
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
        structuredLogger.warn('[api/admin/bulk-operations] headers() unavailable during prerender', error, {
          route: '/api/admin/bulk-operations',
        });
        return new Response(null, { status: 204 });
      }
      throw error;
    }
    
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const operations = Object.entries(OPERATION_DESCRIPTIONS).map(([id, description]) => ({
      id,
      description,
    }));

    return NextResponse.json({ operations });
  } catch (error) {
    structuredLogger.error('Admin bulk operations GET error', error, {
      route: '/api/admin/bulk-operations',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to load bulk operation metadata' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth(request.headers);
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const operation = body?.operation as BulkOperationType | undefined;
    const rawIds = Array.isArray(body?.ids) ? body.ids : [];
    const ids = rawIds.filter(
      (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0
    );

    const MAX_IDS = 1000; // Adjust based on your requirements

    if (!operation) {
      return NextResponse.json({ error: 'operation is required' }, { status: 400 });
    }

    if (!Object.hasOwn(OPERATION_DESCRIPTIONS, operation)) {
      return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    if (!ids.length) {
      return NextResponse.json(
        {
          error: 'ids must contain at least one valid document identifier',
        },
        { status: 400 }
      );
    }

    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        {
          error: `ids array exceeds maximum length of ${MAX_IDS}`,
        },
        { status: 400 }
      );
    }

    const result = await runBulkOperation({ operation, ids });

    return NextResponse.json({
      message: `${result.succeeded} of ${result.total} documents processed`,
      result,
    });
  } catch (error) {
    structuredLogger.error('Admin bulk operations POST error', error, {
      route: '/api/admin/bulk-operations',
      method: 'POST',
    });
    return NextResponse.json({ error: 'Failed to run bulk operation' }, { status: 500 });
  }
}
