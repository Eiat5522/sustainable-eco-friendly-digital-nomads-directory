import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUser } from '@/lib/auth/dal';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth(request.headers);
    const sessionUser = session?.user as SessionUser;

    if (!ensureAdmin(sessionUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, password, role, status } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      name,
      email,
      password,
      role: role as UserRole,
      status: status as 'active' | 'suspended' | 'pending',
    });

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user. Email might already be in use.' },
        { status: 409 }
      );
    }

    structuredLogger.info('Admin created new user', {
      adminId: sessionUser?.id,
      newUserId: newUser.id,
      newUserEmail: newUser.email,
      component: 'admin-api',
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    structuredLogger.error('Admin create user error', error, {
      route: '/api/admin/create-user',
      method: 'POST',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
