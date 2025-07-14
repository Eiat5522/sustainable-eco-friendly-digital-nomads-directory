import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserById } from '@/lib/auth/serverAuth';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

/**
 * API route to get current user profile
 * This runs in Node.js runtime (not Edge) to allow MongoDB operations
 */
export async function GET(request: NextRequest) {
  try {
    // Get session (works in API routes with Node.js runtime)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use server-side function to get user data
    const user = await getUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API route to update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, image } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    // Update user profile using server-side function
    const success = await updateUserProfile(session.user.id, { name, image });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Server-side function for updating user profile
async function updateUserProfile(
  userId: string,
  updateData: { name: string; image?: string }
): Promise<boolean> {
  try {
    // Import here to avoid Edge Runtime issues
    const dbConnect = (await import('@/lib/dbConnect')).default;
    const User = (await import('@/models/User')).default;

    await dbConnect();

    const result = await User.findByIdAndUpdate(
      userId,
      {
        name: updateData.name,
        ...(updateData.image && { image: updateData.image }),
      },
      { new: true }
    );

    return !!result;
  } catch (error) {
    console.error('Update user profile error:', error);
    return false;
  }
}
