import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserById } from '@/lib/auth/serverAuth';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Dashboard Server Component Example
 * Demonstrates Edge-compatible auth with server-side data fetching
 */
export default async function DashboardPage() {
  // Get session on server side (Node.js runtime)
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  // Get full user data from database using server function
  const user = await getUserById(session.user.id);

  if (!user) {
    redirect('/auth/signin?error=user_not_found');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Role:</span> {user.role}</p>
              <p><span className="font-medium">Status:</span> Active</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a
                href="/profile"
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Edit Profile
              </a>

              {(user.role === 'venue_owner' || user.role === 'admin') && (
                <a
                  href="/listings/create"
                  className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                >
                  Create Listing
                </a>
              )}

              {user.role === 'admin' && (
                <a
                  href="/admin"
                  className="block w-full text-center bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  Admin Panel
                </a>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Your Activity</h2>
            <div className="space-y-2">
              <DashboardStats userId={user.id} userRole={user.role} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stats component that fetches data server-side
 */
async function DashboardStats({
  userId,
  userRole
}: {
  userId: string;
  userRole: string;
}) {
  // This would typically fetch user-specific stats from the database
  // Using server-side functions to avoid Edge Runtime limitations

  const stats = await getUserStats(userId, userRole);

  return (
    <>
      <p><span className="font-medium">Listings:</span> {stats.listings}</p>
      <p><span className="font-medium">Reviews:</span> {stats.reviews}</p>
      <p><span className="font-medium">Favorites:</span> {stats.favorites}</p>
    </>
  );
}

/**
 * Server-side function to get user statistics
 * This runs in Node.js runtime with full MongoDB access
 */
async function getUserStats(userId: string, userRole: string) {
  try {
    // Import dynamically to avoid Edge Runtime issues
    const dbConnect = (await import('@/lib/dbConnect')).default;

    await dbConnect();

    // Mock stats for now - replace with actual database queries
    const stats = {
      listings: userRole === 'venue_owner' || userRole === 'admin' ? 3 : 0,
      reviews: 12,
      favorites: 8,
    };

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      listings: 0,
      reviews: 0,
      favorites: 0,
    };
  }
}
