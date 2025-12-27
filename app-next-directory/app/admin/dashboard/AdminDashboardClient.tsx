'use client';

import Link from 'next/link';
import type { AdminAnalyticsSnapshot, AdminModerationEntry } from '@/lib/admin/analytics';

type AdminDashboardData = {
  analytics: AdminAnalyticsSnapshot;
  moderationQueue: AdminModerationEntry[];
  generatedAt: string;
};

interface AdminDashboardClientProps {
  adminData?: AdminDashboardData;
}

export default function AdminDashboardClient({
  adminData: _adminData,
}: AdminDashboardClientProps) {
  return (
    <section className="space-y-6" data-testid="admin-dashboard">
      <div className="neo-card rounded-2xl bg-neo-surface p-6 md:p-8">
        <h2 className="heading-md mb-3" data-testid="admin-dashboard-title">
          Admin Dashboard
        </h2>
        <p className="body-md mb-4">
          The admin dashboard is temporarily simplified during the Next.js 16 Cache Components
          migration.
        </p>
        <p className="body-sm text-neo-text-secondary">
          Admin functionality is accessible. Full dashboard analytics will be restored in a future
          update.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/users"
          className="neo-card group rounded-2xl bg-neo-surface p-5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px] hover:shadow-neo-shadow"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neo-text-secondary">
            Users
          </p>
          <h3 className="heading-sm mt-3 text-neo-text-primary">Manage Users</h3>
          <p className="body-sm mt-2">Review roles, access, and permissions.</p>
        </Link>
        <Link
          href="/admin/listings"
          className="neo-card group rounded-2xl bg-neo-surface p-5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px] hover:shadow-neo-shadow"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neo-text-secondary">
            Listings
          </p>
          <h3 className="heading-sm mt-3 text-neo-text-primary">Manage Listings</h3>
          <p className="body-sm mt-2">Approve submissions and curate highlights.</p>
        </Link>
        <Link
          href="/admin/settings"
          className="neo-card group rounded-2xl bg-neo-surface p-5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px] hover:shadow-neo-shadow"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neo-text-secondary">
            Settings
          </p>
          <h3 className="heading-sm mt-3 text-neo-text-primary">Tune Settings</h3>
          <p className="body-sm mt-2">Configure platform preferences.</p>
        </Link>
        <Link
          href="/"
          className="neo-card group rounded-2xl bg-neo-secondary/20 p-5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px] hover:shadow-neo-shadow"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neo-text-secondary">
            Directory
          </p>
          <h3 className="heading-sm mt-3 text-neo-text-primary">Back to Site</h3>
          <p className="body-sm mt-2">Return to the public experience.</p>
        </Link>
      </div>
    </section>
  );
}
