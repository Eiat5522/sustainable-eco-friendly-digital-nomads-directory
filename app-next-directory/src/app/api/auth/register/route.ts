import connect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
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

    await connect();

    const existingUser = await User.findOne({ email });
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
    const user = await User.create({
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
          message: error instanceof Error ? error.message : 'Internal server error'
        }
      },
      { status: 500 }
    );
  }
}


