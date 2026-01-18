import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';
import { getAdminListingStats, getAdminListings } from './data';
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
    redirect('/auth/login?callbackUrl=/admin/listings');
  }

  const [listingsResult, statsResult] = await Promise.allSettled([
    getAdminListings(),
    getAdminListingStats(),
  ]);
  const initialListings = listingsResult.status === 'fulfilled' ? listingsResult.value : null;
  const initialStats = statsResult.status === 'fulfilled' ? statsResult.value : null;

  if (listingsResult.status === 'rejected') {
    structuredLogger.error?.('Failed to fetch admin listings', {
      error:
        listingsResult.reason instanceof Error
          ? { name: listingsResult.reason.name, message: listingsResult.reason.message }
          : String(listingsResult.reason),
    });
  }
  if (statsResult.status === 'rejected') {
    structuredLogger.error?.('Failed to fetch admin listing stats', {
      error:
        statsResult.reason instanceof Error
          ? { name: statsResult.reason.name, message: statsResult.reason.message }
          : String(statsResult.reason),
    });
  }

  return (
    <Suspense fallback={<div>Loading listings management...</div>}>
      <section className="space-y-6" data-testid="admin-listings-page">
        <header className="space-y-2">
          <h2 className="heading-md text-neo-text-primary" data-testid="admin-listings-title">
            Listing Management
          </h2>
          <p className="body-md">Manage listings, approve submissions, and feature content.</p>
        </header>

        <div className="neo-card rounded-2xl bg-neo-surface p-4 md:p-6">
          <ListingsManagementTable
            initialData={initialListings ?? undefined}
            initialStats={initialStats ?? undefined}
          />
        </div>
      </section>
    </Suspense>
  );
}
