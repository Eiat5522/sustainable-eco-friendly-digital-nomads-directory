'use client';

import Link from 'next/link';

export default function AdminDashboardClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" data-testid="admin-dashboard">
      <div className="p-8 bg-white shadow-md rounded-lg text-center max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4" data-testid="admin-dashboard-title">Admin Dashboard</h1>
        <p className="text-gray-600 mb-4">
          The admin dashboard is temporarily simplified during the Next.js 16 Cache Components
          migration.
        </p>
        <p className="text-sm text-gray-500">
          Admin functionality is accessible. Full dashboard analytics will be restored in a future
          update.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <a
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Manage Users
          </a>
          <a
            href="/admin/listings"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Manage Listings
          </a>
          <a
            href="/admin/settings"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Settings
          </a>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Back to Site
          </Link>
        </div>
      </div>
    </div>
  );
}
