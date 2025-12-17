import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateUserRole, updateUserStatus } from '@/lib/auth/dal';
import dbConnect from '@/lib/dbConnect';
import { structuredLogger } from '@/lib/logger';
import User, { type IUser } from '@/models/User';
import type { UserRole } from '@/types/auth';

type RouteContext = { params: Promise<Record<string, never>> };

type SessionUser = { id?: string; role?: UserRole } | undefined;

type UserListItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  lastActiveAt: string | null;
  status: 'active' | 'suspended' | 'pending';
};

// Valid roles for filtering and assignment
const VALID_ROLES: UserRole[] = ['user', 'venueOwner', 'admin', 'superAdmin'];

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

function ensureSuperAdmin(sessionUser: SessionUser): boolean {
  return sessionUser?.role === 'superAdmin';
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
        structuredLogger.warn('[api/admin/users] headers() unavailable during prerender', error, {
          route: '/api/admin/users',
        });
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
    const roleFilter = url.searchParams.get('role') as UserRole | null;

    const offset = (page - 1) * limit;

    await dbConnect();

    // Build MongoDB query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (roleFilter && VALID_ROLES.includes(roleFilter)) {
      query.role = roleFilter;
    }

    // Fetch users from MongoDB
    const UserModel = User as unknown as import('mongoose').Model<IUser>;
    const [users, totalCount] = await Promise.all([
      UserModel.find(query)
        .select('_id name email role status createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    const userList: UserListItem[] = users.map(user => ({
      id: user._id.toString(),
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role ?? 'user',
      createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
      lastActiveAt: user.updatedAt?.toISOString() ?? null,
      status: (user.status as 'active' | 'suspended' | 'pending') ?? 'active',
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
  let userIdValue: string | undefined;
  try {
    const session = await auth(request.headers);
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const userId = body?.userId;
    userIdValue = typeof userId === 'string' ? userId : undefined;
    const newRole = body?.role as UserRole | undefined;
    const newStatus = body?.status as 'active' | 'suspended' | 'pending' | undefined;
    const action = typeof body?.action === 'string' ? body.action : undefined;

    if (!userIdValue) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Only admin can change roles (per requirement: Allow users with role `admin` to assign the `superAdmin` role)
    if (newRole && !ensureAdmin(sessionUser)) {
      return NextResponse.json(
        {
          error: 'Admin access required for role changes',
        },
        { status: 403 }
      );
    }

    // Validate role
    if (newRole && !VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (newStatus && !['active', 'suspended', 'pending'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    let derivedStatus: 'active' | 'suspended' | 'pending' | undefined = newStatus;
    if (action) {
      if (action === 'suspend') {
        derivedStatus = 'suspended';
      } else if (action === 'activate') {
        derivedStatus = 'active';
      } else {
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
      }
    }

    // Prevent self-demotion for superAdmin
    if (
      newRole &&
      sessionUser?.id === userIdValue &&
      sessionUser?.role === 'superAdmin' &&
      newRole !== 'superAdmin'
    ) {
      return NextResponse.json(
        {
          error: 'Cannot change your own superAdmin role',
        },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update role if provided
    if (newRole) {
      const roleUpdated = await updateUserRole(userIdValue, newRole);
      if (!roleUpdated) {
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
      }
    }

    // Update status if provided
    if (derivedStatus) {
      const statusUpdated = await updateUserStatus(userIdValue, derivedStatus);
      if (!statusUpdated) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (newRole) updates.role = newRole;
    if (derivedStatus) updates.status = derivedStatus;
    updates.updatedAt = new Date().toISOString();
    updates.updatedBy = sessionUser?.id;

    return NextResponse.json({
      message: 'User updated successfully',
      userId: userIdValue,
      updates,
    });
  } catch (error) {
    structuredLogger.error('Admin users PATCH error', error, {
      route: '/api/admin/users',
      method: 'PATCH',
    });
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, _context: RouteContext) {
  let userIdValue: string | undefined;
  try {
    const session = await auth(request.headers);
    const sessionUser = session?.user as SessionUser;

    if (!ensureSuperAdmin(sessionUser)) {
      return NextResponse.json(
        { error: 'SuperAdmin access required for user deletion' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const userId = body?.userId;
    userIdValue = typeof userId === 'string' ? userId : undefined;

    if (!userIdValue) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (sessionUser?.id === userIdValue) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    await dbConnect();

    // Delete user from MongoDB
    const UserModel = User as unknown as import('mongoose').Model<IUser>;
    const result = await UserModel.deleteOne({ _id: userIdValue });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      userId: userIdValue,
    });
  } catch (error) {
    structuredLogger.error('Admin users DELETE error', error, {
      route: '/api/admin/users',
      method: 'DELETE',
    });
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
