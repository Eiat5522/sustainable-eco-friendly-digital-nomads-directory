'use client';

import { useSession, signIn, signOut, SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { UserRole, hasPagePermission, hasFeaturePermission } from "../../src/types/auth";

interface DashboardStats {
  totalListings: number;
  totalUsers: number;
  totalReviews: number;
  pendingModeration: number;
}

/**
 * User Dashboard Page Component
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const user = session?.user;
  const userRole = (user as any)?.role as UserRole || 'unidentifiedUser';

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
  }, [session, status]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!session) return;

      try {
        const response = await fetch('/api/user/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadDashboardData();
    }
  }, [session]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const canAccessAnalytics = hasFeaturePermission(userRole, 'accessAnalytics');
  const canManageUsers = hasFeaturePermission(userRole, 'manageUserRoles');
  const canModerateContent = hasFeaturePermission(userRole, 'moderateListings');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
              {userRole}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {canAccessAnalytics && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Listings
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalListings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Users
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Total Reviews
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalReviews}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Pending Moderation
            </h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingModeration}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Management</h3>
          <div className="space-y-3">
            <a
              href="/profile"
              className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              Edit Profile
            </a>
            <a
              href="/profile/settings"
              className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              Account Settings
            </a>
          </div>
        </div>

        {/* Content Management */}
        {hasFeaturePermission(userRole, 'submitListings') && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Management</h3>
            <div className="space-y-3">
              <a
                href="/listings/create"
                className="block w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
              >
                Create New Listing
              </a>
              <a
                href="/listings/manage"
                className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
              >
                Manage My Listings
              </a>
            </div>
          </div>
        )}

        {/* Admin Tools */}
        {(canManageUsers || canModerateContent) && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Tools</h3>
            <div className="space-y-3">
              {canModerateContent && (
                <a
                  href="/admin/moderation"
                  className="block w-full text-left px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-md transition-colors"
                >
                  Moderation Queue
                </a>
              )}
              {canManageUsers && (
                <a
                  href="/admin/users"
                  className="block w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                >
                  User Management
                </a>
              )}
              {canAccessAnalytics && (
                <a
                  href="/admin/analytics"
                  className="block w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
                >
                  Analytics
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-gray-600">
          <p>Your recent activity will appear here.</p>
        </div>
      </div>
    </div>
  );
}
