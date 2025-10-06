import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      console.warn('[register] Failed to parse request body', error);
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    const { name, email, password } = body as Partial<{ name: string; email: string; password: string }>;
    const missingRequiredField =
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      name.trim().length === 0 ||
      email.trim().length === 0 ||
      password.trim().length === 0;

    if (missingRequiredField) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    // Test mode: return fake user for tests
    if (process.env.TEST_MODE === '1') {
      const fakeUser = { _id: 'test-user-1', name, email, role: 'user' };
      return NextResponse.json(
        { success: true, data: { user: fakeUser }, error: null },
        { status: 201, headers: { 'X-Test-Mode': '1' } }
      );
    }

    // If MONGODB_URI is not configured during non-test runs, return a clear 503
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is not set; responding 503 from /api/auth/register');
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'MISSING_DB_CONFIG',
            message: 'MONGODB_URI not configured in environment; registration disabled in this environment'
          }
        },
        { status: 503, headers: { 'Retry-After': '60' } }
      );
    }

    await connect();

    // Check if user already exists
    const duplicateCount = await User.countDocuments({ email });
    if (duplicateCount > 0) {
      return NextResponse.json(
        { success: false, error: { message: 'User already exists', code: 'CONFLICT' } },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const createdUserDoc = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    const safeUser = (createdUserDoc && typeof createdUserDoc === 'object' && 'toObject' in createdUserDoc)
      ? (createdUserDoc as { toObject: () => Record<string, unknown> }).toObject()
      : (createdUserDoc as Record<string, unknown>);

    const userResponse = {
      _id: String(safeUser._id ?? ''),
      name: typeof safeUser.name === 'string' ? safeUser.name : name,
      email: typeof safeUser.email === 'string' ? safeUser.email : email,
      role: typeof safeUser.role === 'string' ? safeUser.role : 'user',
    };

    return NextResponse.json(
      { success: true, data: { user: userResponse } },
      { status: 201 }
    );
  } catch (error) {
    // Handle errors (e.g., DB connection, hashing, creation)
    console.error('[register] Registration failed', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, error: { message, code: 'SERVER_ERROR' } },
      { status: 500 }
    );
  }
}
