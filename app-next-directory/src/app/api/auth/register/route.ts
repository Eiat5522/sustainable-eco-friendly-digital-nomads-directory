import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSanityUser, findSanityUserByEmail } from '../../../../lib/auth/userService'; // Corrected relative path
import dbConnect from '../../../../lib/dbConnect'; // Corrected relative path
import User from '../../../../models/User'; // Corrected relative path
import { UserRole } from '../../../../types/auth'; // Corrected relative path

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
    await dbConnect(); // Use Mongoose dbConnect utility

    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        // Using success: false to align with previous responses, but message is more conventional for errors
        { message: validationResult.error.errors[0].message, errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists in MongoDB using Mongoose model
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if user exists in Sanity (keeping this check as it was)
    const existingSanityUser = await findSanityUserByEmail(email);
    if (existingSanityUser) {
      return NextResponse.json(
        { message: 'User with this email already exists in Sanity' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Salt rounds 12, was 10

    // Create user in MongoDB using Mongoose model
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'user' as UserRole, // Default role, ensure it's a valid UserRole
      // Timestamps are handled by Mongoose schema
    });

    await newUser.save();

    // Create user in Sanity CMS
    try {
        await createSanityUser({
            name: newUser.name,
            email: newUser.email,
            // avatar: newUser.image, // No image on registration yet
            role: 'user', // Default role in Sanity
        });
    } catch (sanityError) {
        console.error('Failed to sync user with Sanity during registration:', sanityError);
        // Optional: Decide if this is a critical error. For now, log and proceed.
    }

    // Exclude password from the returned user object
    const userResponse = {
        _id: newUser._id.toString(), // Convert ObjectId to string
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        // emailVerified: newUser.emailVerified, // Not set during initial registration
        // image: newUser.image, // Not set during initial registration
        createdAt: newUser.createdAt, // Available from Mongoose timestamps
        updatedAt: newUser.updatedAt, // Available from Mongoose timestamps
      };

    return NextResponse.json(
      { message: 'User registered successfully', user: userResponse },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    // Generic error response
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
