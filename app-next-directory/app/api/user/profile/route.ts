import { getUserById } from '@/lib/auth/serverAuth';
import { auth } from '@/lib/auth';

/**
 * API route to get current user profile
 * This runs in Node.js runtime (not Edge) to allow MongoDB operations
 */
export async function getUserProfile(request: Request) {
  try {
    // Get session (works in API routes with Node.js runtime)
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use server-side function to get user data
    const user = await getUserById(session.user.id);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return user data (excluding sensitive information)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get user profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * API route to update user profile
 */
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, image } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return Response.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    // Update user profile using server-side function
    const success = await updateUserProfile(session.user.id, { name, image });

    if (!success) {
      return Response.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    return Response.json(
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
