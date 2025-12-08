import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { UserRole } from '@/types/auth';
import { ListingsManagementTable } from './ListingsManagementTable';



export const metadata: Metadata = {
  title: 'Listing Management - Admin Dashboard',
  robots: { index: false, follow: false },
};

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(
  sessionUser: SessionUser
): sessionUser is { id: string; role: 'admin' | 'superAdmin' } {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export default async function AdminListingsPage() {
  // FORTEST: Wrap headers() in try-catch for compatibility with prerender
  let _h = null as
    | null
    | Awaited<ReturnType<typeof headers>>
    | { get(name: string): string | null | undefined };
  try {
    _h = await headers();
  } catch {
    _h = null;
  }

  const session = await auth(_h);
  const sessionUser = session?.user as SessionUser;

  if (!ensureAdmin(sessionUser)) {
    redirect('/auth/login?callbackUrl=/admin/listings');
  }

  return (
    <main className="min-h-screen bg-gray-50" data-testid="admin-listings-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-listings-title">
            Listing Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage listings, approve submissions, and feature content.
          </p>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <ListingsManagementTable
            currentUserRole={sessionUser.role}
            currentUserId={sessionUser.id}
          />
        </div>
      </div>
    </main>
  );
}
