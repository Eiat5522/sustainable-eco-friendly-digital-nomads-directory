import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';
import { getAdminSettings } from './data';
import { SettingsForm } from './SettingsForm';
import { structuredLogger } from '@/lib/logger';

// MIGRATED: Removed `export const dynamic = 'force-dynamic'` to be compatible
// with `cacheComponents`. This route is dynamic-by-default under Cache Components.
// TODO: If this page should be cached, add `"use cache"` in the appropriate
// component and document a `cacheLife()` profile.

// Short-term: this page touches request-scoped data and admin-only content.
// It does not export `dynamic` to remain compatible with global cache
// components. Convert any uncached work into request-scoped components.

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
    redirect('/auth/login?callbackUrl=/admin/settings');
  }

  let initialSettings = null as Awaited<ReturnType<typeof getAdminSettings>> | null;
  try {
    initialSettings = await getAdminSettings();
  } catch (error) {
    structuredLogger.error?.('Failed to fetch admin settings', {
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
    });
    initialSettings = null;
  }

  return (
    <Suspense fallback={<div>Loading admin settings...</div>}>
      <section className="space-y-6" data-testid="admin-settings-page">
        <header className="space-y-2">
          <h2 className="heading-md text-neo-text-primary" data-testid="admin-settings-title">
            Admin Settings
          </h2>
          <p className="body-md">Configure application settings and preferences.</p>
        </header>

        <div className="neo-card rounded-2xl bg-neo-surface p-4 md:p-6">
          <SettingsForm initialSettings={initialSettings ?? undefined} />
        </div>
      </section>
    </Suspense>
  );
}
