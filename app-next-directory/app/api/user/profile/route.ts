import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById, updateUserProfile } from '@/lib/auth/serverAuth';
import { getRequestContext, structuredLogger } from '@/lib/logger';

type ProfileDependencies = {
  authFn: typeof auth;
  getUserByIdFn: typeof getUserById;
  updateUserProfileFn: typeof updateUserProfile;
};

export function _createProfileHandlers({
  authFn,
  getUserByIdFn,
  updateUserProfileFn,
}: ProfileDependencies) {
  return {
    async GET(request: Request) {
      try {
        const session = await authFn();

        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const user = await getUserByIdFn(session.user.id);

        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

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
        structuredLogger.error('Failed to fetch user profile', error, {
          ...getRequestContext(request),
          component: 'api/user/profile',
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    },

    async PUT(request: Request) {
      try {
        const session = await authFn();

        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { name, image } = body;

        if (!name || typeof name !== 'string') {
          return NextResponse.json(
            { error: 'Name is required and must be a string' },
            { status: 400 }
          );
        }

        const updatedUser = await updateUserProfileFn(session.user.id, { name, image });

        if (!updatedUser) {
          return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          data: {
            user: {
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              image: updatedUser.image,
              role: updatedUser.role,
            },
          },
        });
      } catch (error) {
        structuredLogger.error('Failed to update user profile', error, {
          ...getRequestContext(request),
          component: 'api/user/profile',
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
  };
}

/**
 * API route to get current user profile
 * This runs in Node.js runtime (not Edge) to allow MongoDB operations
 */
const { GET, PUT } = _createProfileHandlers({
  authFn: auth,
  getUserByIdFn: getUserById,
  updateUserProfileFn: updateUserProfile,
});

export { GET, PUT };
