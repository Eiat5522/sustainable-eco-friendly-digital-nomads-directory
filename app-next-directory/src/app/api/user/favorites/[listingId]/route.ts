// app-next-directory/src/app/api/user/favorites/[listingId]/route.ts
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjusted path
import dbConnect from '@/lib/mongodb';
import UserFavorite from '@/models/UserFavorite';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

interface Params {
  listingId: string;
}

/**
 * @swagger
 * /api/user/favorites/{listingId}:
 *   delete:
 *     summary: Remove a listing from the authenticated user's favorites.
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         description: The ID of the listing to unfavorite.
 *         schema:
 *           type: string
 *           format: ObjectId
 *     responses:
 *       200:
 *         description: Favorite removed successfully.
 *       400:
 *         description: Invalid listingId provided.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Favorite not found.
 *       500:
 *         description: Internal server error.
 */
export async function DELETE(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { listingId } = params;

  if (!listingId || !mongoose.Types.ObjectId.isValid(listingId)) {
    return NextResponse.json(
      { success: false, message: 'Invalid listingId provided' },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const listingObjectId = new mongoose.Types.ObjectId(listingId);

    const result = await UserFavorite.findOneAndDelete({
      userId: userId,
      listingId: listingObjectId,
    });

    if (!result) {
      return NextResponse.json({ success: false, message: 'Favorite not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Favorite removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { success: false, message: 'Error removing favorite' },
      { status: 500 }
    );
  }
}
