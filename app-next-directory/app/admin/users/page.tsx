import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { UserManagementTable } from './UserManagementTable';



export const metadata: Metadata = {
  title: 'User Management - Admin Dashboard',
  robots: { index: false, follow: false },
};

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(
  sessionUser: SessionUser
): sessionUser is { id: string; role: 'admin' | 'superAdmin' } {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export default async function AdminUsersPage() {
  // Auth check is handled by middleware
  // FORTEST: Wrap headers() in try-catch for compatibility with prerender
  let _h = null as
    | null
    | Awaited<Awaited<ReturnType<typeof headers>>>
    | { get(name: string): string | null | undefined };
  try {
    _h = await headers();
  } catch {
    _h = null;
  }

  const session = await auth(_h);
  const sessionUser = session?.user as SessionUser;

  if (!ensureAdmin(sessionUser)) {
    redirect('/auth/login?callbackUrl=/admin/users');
  }

  return (
    <Suspense fallback={<div>Loading user management...</div>}>
      <section className="space-y-6" data-testid="admin-users-page">
        <header className="space-y-2">
          <h2 className="heading-md text-neo-text-primary" data-testid="admin-users-title">
            User Management
          </h2>
          <p className="body-md">Manage user accounts, roles, and permissions.</p>
        </header>

        <div className="neo-card rounded-2xl bg-neo-surface p-4 md:p-6">
          <UserManagementTable currentUserRole={sessionUser.role} currentUserId={sessionUser.id} />
        </div>
      </section>
    </Suspense>
  );
}
