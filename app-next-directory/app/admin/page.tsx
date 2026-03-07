import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';
import AdminDashboardClient from './AdminDashboardClient';
import { getAdminDashboardData } from './data';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

type SessionUser = { id?: string; role?: UserRole } | undefined;
type AdminPageSearchParams = Promise<{ months?: string }>;

function ensureAdmin(
  sessionUser: SessionUser
): sessionUser is { id: string; role: 'admin' | 'superAdmin' } {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

function normalizeMonths(monthsParam: string | undefined) {
  if (monthsParam === '6') return 6;
  if (monthsParam === '12') return 12;
  return 3;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: AdminPageSearchParams;
}) {
  let requestHeaders = null as
    | null
    | Awaited<Awaited<ReturnType<typeof headers>>>
    | { get(name: string): string | null | undefined };
  try {
    requestHeaders = await headers();
  } catch {
    requestHeaders = null;
  }

  const session = await auth(requestHeaders);
  const sessionUser = session?.user as SessionUser;

  if (!ensureAdmin(sessionUser)) {
    redirect('/auth/login?callbackUrl=/admin');
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const months = normalizeMonths(resolvedSearchParams?.months);
  let adminData = null as Awaited<ReturnType<typeof getAdminDashboardData>> | null;
  let errorMessage = null as string | null;

  try {
    adminData = await getAdminDashboardData(months);
  } catch (error) {
    structuredLogger.error('Failed to fetch admin dashboard analytics', error, {
      route: '/admin',
      component: 'admin.dashboard',
    });

    errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch admin dashboard analytics';
  }

  return <AdminDashboardClient adminData={adminData ?? undefined} errorMessage={errorMessage} />;
}
