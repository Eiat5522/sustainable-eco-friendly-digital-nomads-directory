import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { runBulkOperation, type BulkOperationType } from '@/lib/admin/analytics';

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

export async function GET(_request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
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
    console.error('Admin bulk operations GET error:', error);
    return NextResponse.json({ error: 'Failed to load bulk operation metadata' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const operation = body?.operation as BulkOperationType | undefined;
    const rawIds = Array.isArray(body?.ids) ? body.ids : [];
    const ids = rawIds.filter((id: unknown): id is string =>
      typeof id === 'string' && id.trim().length > 0
    );

    const MAX_IDS = 1000; // Adjust based on your requirements

    if (!operation) {
      return NextResponse.json({ error: 'operation is required' }, { status: 400 });
    }

    if (!Object.prototype.hasOwnProperty.call(OPERATION_DESCRIPTIONS, operation)) {
      return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    if (!ids.length) {
      return NextResponse.json({
        error: 'ids must contain at least one valid document identifier',
      }, { status: 400 });
    }

    if (ids.length > MAX_IDS) {
      return NextResponse.json({
        error: `ids array exceeds maximum length of ${MAX_IDS}`,
      }, { status: 400 });
    }

    const result = await runBulkOperation({ operation, ids });

    return NextResponse.json({
      message: `${result.succeeded} of ${result.total} documents processed`,
      result,
    });
  } catch (error) {
    console.error('Admin bulk operations POST error:', error);
    return NextResponse.json({ error: 'Failed to run bulk operation' }, { status: 500 });
  }
}
