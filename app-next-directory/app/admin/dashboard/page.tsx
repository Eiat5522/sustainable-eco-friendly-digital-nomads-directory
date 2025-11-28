import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import DashboardContent, { loadAnalytics } from './DashboardContent';

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

  const { analytics, errorMessage } = await loadAnalytics();

  return <DashboardContent analytics={analytics} errorMessage={errorMessage} />;
}
