import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { client } from '@/lib/sanity/client';
import { structuredLogger } from '@/lib/logger';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

type UserListItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  lastActiveAt: string | null;
  status: 'active' | 'inactive';
};

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

function ensureSuperAdmin(sessionUser: SessionUser): boolean {
  return sessionUser?.role === 'superAdmin';
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
    const roleFilter = url.searchParams.get('role') as UserRole | null;

    const offset = (page - 1) * limit;

    // Build search query
    let searchCondition = '';
    if (search) {
      searchCondition = `&& (name match "*${search}*" || email match "*${search}*")`;
    }

    let roleCondition = '';
    if (roleFilter && ['admin', 'user', 'editor', 'venueOwner', 'superAdmin', 'moderator', 'contentEditor', 'unidentifiedUser'].includes(roleFilter)) {
      roleCondition = `&& role == "${roleFilter}"`;
    }

    const query = `*[_type == "user" ${searchCondition} ${roleCondition}] | order(_createdAt desc) [${offset}...${offset + limit}] {
      _id,
      name,
      email,
      role,
      _createdAt,
      lastActiveAt,
      "status": coalesce(status, "active")
    }`;

    const countQuery = `count(*[_type == "user" ${searchCondition} ${roleCondition}])`;

    const [users, totalCount] = await Promise.all([
      client.fetch<Array<{
        _id: string;
        name?: string | null;
        email?: string | null;
        role?: UserRole;
        _createdAt?: string;
        lastActiveAt?: string | null;
        status?: 'active' | 'inactive';
      }>>(query),
      client.fetch<number>(countQuery)
    ]);

    const userList: UserListItem[] = users.map(user => ({
      id: user._id,
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role ?? 'user',
      createdAt: user._createdAt ?? new Date().toISOString(),
      lastActiveAt: user.lastActiveAt ?? null,
      status: user.status ?? 'active',
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users: userList,
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
        role: roleFilter,
      },
    });
  } catch (error) {
    structuredLogger.error('Admin users GET error', error, {
      route: '/api/admin/users',
      method: 'GET',
    });
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
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
    const userId = body?.userId;
    const newRole = body?.role as UserRole | undefined;
    const newStatus = body?.status as 'active' | 'inactive' | undefined;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Only superAdmin can change roles
    if (newRole && !ensureSuperAdmin(sessionUser)) {
      return NextResponse.json({ 
        error: 'SuperAdmin access required for role changes' 
      }, { status: 403 });
    }

    if (newRole && !['admin', 'user', 'editor', 'venueOwner', 'superAdmin', 'moderator', 'contentEditor', 'unidentifiedUser'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (newStatus && !['active', 'inactive'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Prevent self-demotion for superAdmin
    if (newRole && sessionUser?.id === userId && sessionUser?.role === 'superAdmin' && newRole !== 'superAdmin') {
      return NextResponse.json({ 
        error: 'Cannot change your own superAdmin role' 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (newRole) updateData.role = newRole;
    if (newStatus) updateData.status = newStatus;
    updateData.updatedAt = new Date().toISOString();
    updateData.updatedBy = sessionUser?.id;

    await client.patch(userId).set(updateData).commit();

    return NextResponse.json({ 
      message: 'User updated successfully',
      userId,
      updates: updateData,
    });
  } catch (error) {
    structuredLogger.error('Admin users PATCH error', error, {
      route: '/api/admin/users',
      method: 'PATCH',
    });
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}