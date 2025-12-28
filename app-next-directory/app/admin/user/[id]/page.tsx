import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/auth/dal';
import type { UserRole } from '@/types/auth';
import { EditUserForm } from '../EditUserForm';

export const metadata: Metadata = {
  title: 'Edit User - Admin',
  robots: { index: false, follow: false },
};

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(
  sessionUser: SessionUser
): sessionUser is { id: string; role: 'admin' | 'superAdmin' } {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Guarded server page
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
    redirect(`/auth/login?callbackUrl=/admin/user/${id}`);
  }

  const user = await getUserById(id);

  if (!user) {
    return (
      <section className="p-6">
        <h2 className="heading-md">User not found</h2>
        <p className="body-md">No user found for the provided id.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 p-4" data-testid="admin-edit-user-page">
      <header>
        <h2 className="heading-md">Edit User</h2>
        <p className="body-md">Modify role and account status for this user.</p>
      </header>

      <div className="neo-card rounded-2xl bg-neo-surface p-4 md:p-6">
        {/* pass server-fetched user as initial data to client form */}
        <EditUserForm
          initialUser={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: (user.status as 'active' | 'suspended' | 'pending') ?? 'active',
          }}
        />
      </div>
    </section>
  );
}
