import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import DashboardContent from './DashboardContent';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

function ensureAdminRole(role: UserRole | undefined): role is 'admin' | 'superAdmin' {
  return role === 'admin' || role === 'superAdmin';
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: UserRole } | undefined;

  if (!ensureAdminRole(sessionUser?.role)) {
    redirect('/auth/login?callbackUrl=/admin/dashboard');
  }

  // Render the dynamic content within Suspense
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="p-8 bg-white shadow-md rounded-lg text-center">
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">
              Loading Admin Dashboard...
            </h1>
            <p className="text-gray-600">Please wait</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
