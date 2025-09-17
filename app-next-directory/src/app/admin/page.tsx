import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasPagePermission } from '@/types/auth';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.role || !hasPagePermission(session.user.role, 'admin', 'canView')) {
    redirect('/auth/login?callbackUrl=/admin');
  }

  // Redirect to dashboard as the main admin page
  redirect('/admin/dashboard');
}