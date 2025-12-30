import bcrypt from 'bcryptjs';
import { NextResponse, type NextRequest } from 'next/server';
import connect from '@/lib/dbConnect';
import structuredLogger from '@/lib/logger';
import User, { BCRYPT_COST, ROLE_VALUES, type Role } from '@/models/User';

const isE2EEnvironment = process.env.E2E === '1' || process.env.NEXT_PUBLIC_E2E === '1';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export async function POST(request: NextRequest) {
  if (!isE2EEnvironment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!process.env.MONGODB_URI) {
    structuredLogger.warn('MONGODB_URI is not set; responding 503 from /api/e2e/setup-user', {
      component: 'e2e',
    });
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'MISSING_DB_CONFIG',
          message: 'MONGODB_URI not configured in environment; E2E setup disabled',
        },
      },
      { status: 503, headers: { 'Retry-After': '60' } }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    const errorForLog = error instanceof Error ? error : new Error(String(error));
    structuredLogger.warn('[e2e/setup-user] Failed to parse request body', {
      component: 'e2e',
      error: errorForLog.message,
    });
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
      { status: 400 }
    );
  }

  const { email, password, role, name } = payload as Partial<{
    email: string;
    password: string;
    role: Role;
    name: string;
  }>;

  const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';
  const requestedRole = role && ROLE_VALUES.includes(role) ? role : null;

  if (!normalizedEmail || typeof password !== 'string' || password.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
      { status: 400 }
    );
  }

  const resolvedRole = requestedRole ?? 'user';
  const resolvedName =
    typeof name === 'string' && name.trim().length > 0 ? name.trim() : `E2E ${resolvedRole} User`;

  try {
    await connect();

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    const userDoc = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          name: resolvedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: resolvedRole,
          status: 'active',
          emailVerified: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: String(userDoc?._id ?? ''),
            email: userDoc?.email ?? normalizedEmail,
            role: userDoc?.role ?? resolvedRole,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    structuredLogger.error('[e2e/setup-user] Failed to setup user', error, {
      component: 'e2e',
      email: normalizedEmail,
      role: resolvedRole,
    });
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: { message, code: 'SERVER_ERROR' } },
      { status: 500 }
    );
  }
}
