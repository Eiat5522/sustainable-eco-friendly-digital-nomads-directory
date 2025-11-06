import { authOptions } from '@/lib/auth';
import { findSanityUserByEmail, updateSanityUserWithAuthDetails } from '@/lib/auth/userService';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const updateProfileSchema = z.object({
  userId: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
});

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, name, bio, image } = validationResult.data;

    // Security check: user can only update their own profile
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'You can only update your own profile' },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();

    // Update user in MongoDB
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          name,
          ...(image && { image }),
        }
      }
    );

    // Update user in Sanity if exists
    if (session.user.email) {
      const sanityUser = await findSanityUserByEmail(session.user.email);

      if (sanityUser) {
        await updateSanityUserWithAuthDetails(sanityUser._id, {
          name,
          avatar: image,
        });

        // Also update Sanity bio field
        if (bio !== undefined) {
          const client = createClient({
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
            apiVersion: "v2023-06-01",
            token: process.env.SANITY_API_TOKEN,
            useCdn: false,
          });

          await client
            .patch(sanityUser._id)
            .set({ bio: bio })
            .commit();
        }
      }
    }

    return NextResponse.json(
      { success: true, message: 'Profile updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}

// Importing Sanity client for bio updates
import { createClient } from "next-sanity";
