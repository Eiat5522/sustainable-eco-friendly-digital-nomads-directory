import connect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body: Must be valid JSON'
          }
        },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body: Must be an object'
          }
        },
        { status: 400 }
      );
    }

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body: All fields are required'
          }
        },
        { status: 400 }
      );
    }

    // Only short-circuit when explicitly enabled to avoid interfering with unit tests.
    // Use TEST_MODE=1 in development to enable; do NOT auto-enable in NODE_ENV=='test'.
    if (process.env.TEST_MODE === '1') {
      const fakeUser = { _id: 'test-user-1', name, email, role: 'user' };
      return NextResponse.json(
        { success: true, data: { user: fakeUser }, error: null },
        { status: 201, headers: { 'X-Test-Mode': '1' } }
      );
    }
    // If MONGODB_URI is not configured during non-test runs, return a clear 503 to avoid generic 500 errors.
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

    const existingUser = await (User as any).findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: 'CONFLICT',
            message: 'User already exists'
          }
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await (User as any).create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return NextResponse.json(
      {
        success: true,
        data: { user: userResponse },
        error: null
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'SERVER_ERROR',
          message:
            process.env.NODE_ENV !== 'production' && error instanceof Error
              ? error.message
              : 'Internal server error'
        }
      },
      { status: 500 }
    );
  }
}


