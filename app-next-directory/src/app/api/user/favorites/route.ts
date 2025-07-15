// app-next-directory/src/app/api/user/favorites/route.ts
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjusted path
import dbConnect from '@/lib/mongodb';
import UserFavorite from '@/models/UserFavorite';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

/**
 * @swagger
 * /api/user/favorites:
 *   get:
 *     summary: Retrieve the authenticated user's favorite listings.
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of favorite listings.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserFavorite'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect;

  try {
    const favorites = await UserFavorite.find({ userId: session.user.id })
      // .populate('listingId') // Uncomment if you have a Listing model in MongoDB and want to populate details
      .lean();
    return NextResponse.json({ success: true, data: favorites }, { status: 200 });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching favorites' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/favorites:
 *   post:
 *     summary: Add a listing to the authenticated user's favorites.
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *             properties:
 *               listingId:
 *                 type: string
 *                 format: ObjectId
 *                 description: The ID of the listing to favorite.
 *     responses:
 *       201:
 *         description: Favorite added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserFavorite'
 *       400:
 *         description: Invalid listingId provided.
 *       401:
 *         description: Unauthorized.
 *       409:
 *         description: Listing already in favorites.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect;

  try {
    const { listingId } = await request.json();

    if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid listingId provided' },
        { status: 400 }
      );
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const listingObjectId = new mongoose.Types.ObjectId(listingId);

    // Check if the favorite already exists
    const existingFavorite = await UserFavorite.findOne({
      userId: userId,
      listingId: listingObjectId,
    });

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, message: 'Listing already in favorites' },
        { status: 409 } // 409 Conflict
      );
    }

    const newFavorite = new UserFavorite({
      userId: userId,
      listingId: listingObjectId,
    });

    await newFavorite.save();

    return NextResponse.json({ success: true, data: newFavorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    // Check if the error is a Mongoose duplicate key error
    // Safely check for error.code
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Listing already in favorites (duplicate key).' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, message: 'Error adding favorite' }, { status: 500 });
  }
}
