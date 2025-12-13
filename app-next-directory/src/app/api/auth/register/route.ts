import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authDAL } from '../../../../lib/dal/auth.dal';
import { createSanityUser, findSanityUserByEmail } from '../../../../lib/auth/userService';
import { UserRole } from '../../../../types/auth';

// Validation schema - keeping the existing Zod schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors;
      const message = errors.length > 0 ? errors[0].message : 'Validation failed';
      return NextResponse.json(
        { message, errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists in Sanity (keeping this check as it was)
    const existingSanityUser = await findSanityUserByEmail(email);
    if (existingSanityUser) {
      return NextResponse.json(
        { message: 'User with this email already exists in Sanity' },
        { status: 409 }
      );
    }

    // Create user in MongoDB using DAL
    const newUser = await authDAL.createUser({
      name,
      email,
      password,
      role: 'user' as UserRole,
    });

    // Create user in Sanity CMS
    try {
      await createSanityUser({
        name: newUser.name,
        email: newUser.email,
        role: 'user',
      });
    } catch (sanityError) {
      console.error('Failed to sync user with Sanity during registration:', sanityError);
      // Log and proceed - user is created in MongoDB
    }

    // Exclude password from the returned user object
    const userResponse = {
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return NextResponse.json(
      { message: 'User registered successfully', user: userResponse },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'An error occurred during registration';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
