import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react'; // Add Suspense import
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { SettingsForm } from './SettingsForm';

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)

export const metadata: Metadata = {
  title: 'Settings - Admin Dashboard',
  robots: { index: false, follow: false },
};

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(
  sessionUser: SessionUser
): sessionUser is { id: string; role: 'admin' | 'superAdmin' } {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export default async function AdminSettingsPage() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser;

  if (!ensureAdmin(sessionUser)) {
    redirect('/auth/login?callbackUrl=/admin/settings');
  }

  return (
    <main className="min-h-screen bg-gray-50" data-testid="admin-settings-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-settings-title">
            Admin Settings
          </h1>
          <p className="mt-2 text-gray-600">Configure application settings and preferences.</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <Suspense fallback={
            <div className="p-8 text-center text-gray-500">Loading settings...</div>
          }>
            <SettingsForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
