import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { fetchAdminAnalytics } from '@/lib/admin/analytics';

type RouteContext = { params: Promise<Record<string, never>> };

function ensureAdmin(sessionUser: { role?: UserRole } | undefined): string | null {
  const role = sessionUser?.role;
  if (!role) return null;
  if (role === 'admin' || role === 'superAdmin') {
    return role;
  }
  return null;
}

export async function GET(_request: NextRequest, _context: RouteContext) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { role?: UserRole } | undefined;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const analytics = await fetchAdminAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin analytics' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, _context: RouteContext) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
