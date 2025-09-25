import { NextRequest, NextResponse } from 'next/server';
import connect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

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

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'User already exists', code: 'CONFLICT' } },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    // Prepare response (exclude password)
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    return NextResponse.json(
      { success: true, data: { user: userResponse } },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle errors (e.g., DB connection, hashing, creation)
    return NextResponse.json(
      { success: false, error: { message: error.message, code: 'SERVER_ERROR' } },
      { status: 500 }
    );
  }
}


