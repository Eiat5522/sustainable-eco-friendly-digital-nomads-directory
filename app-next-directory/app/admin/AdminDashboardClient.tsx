import Link from 'next/link';
import {
  DashboardBreakdownChart,
  DashboardDonutChart,
  DashboardMetricCard,
  DashboardTrendChart,
  dashboardChartPalette,
} from '@/components/dashboard/DashboardCharts';
import type { AdminDashboardData } from './data';

const MONTH_OPTIONS = [3, 6, 12] as const;

interface AdminDashboardClientProps {
  adminData?: AdminDashboardData;
  errorMessage?: string | null;
}

function formatQueueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleDateString();
}

export default function AdminDashboardClient({
  adminData,
  errorMessage,
}: AdminDashboardClientProps) {
  if (!adminData) {
    return (
      <section className="space-y-6" data-testid="admin-dashboard">
        <div className="neo-card rounded-2xl bg-neo-surface p-6 md:p-8">
          <h2 className="heading-md mb-3" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h2>
          <p className="body-md mb-2">Analytics are temporarily unavailable.</p>
          <p className="body-sm text-neo-text-secondary">
            {errorMessage ?? 'Refresh the page or try again once admin analytics finish loading.'}
          </p>
        </div>
      </section>
    );
  }

  const roleBreakdown = Object.entries(adminData.userRoles).map(([label, value]) => ({
    label,
    value,
  }));

  const listingBreakdown = [
    {
      label: 'Published',
      value: adminData.listingStatusBreakdown.published,
      color: dashboardChartPalette.primary,
    },
    {
      label: 'Pending',
      value: adminData.listingStatusBreakdown.pending,
      color: dashboardChartPalette.secondary,
    },
    {
      label: 'Draft',
      value: adminData.listingStatusBreakdown.draft,
      color: dashboardChartPalette.accent,
    },
    {
      label: 'Unpublished',
      value: adminData.listingStatusBreakdown.unpublished,
      color: dashboardChartPalette.highlight,
    },
    {
      label: 'Featured',
      value: adminData.listingStatusBreakdown.featured,
      color: dashboardChartPalette.muted,
    },
  ];

  return (
    <section className="space-y-8" data-testid="admin-dashboard">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="heading-md text-neo-text-primary" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h2>
          <p className="body-md max-w-3xl">
            Monitor ecosystem growth, publishing throughput, and moderation pressure from a single
            control room.
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-neo-text-tertiary">
            Updated {new Date(adminData.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MONTH_OPTIONS.map(option => {
            const isActive = adminData.range.months === option;
            return (
              <Link
                key={option}
                href={`/admin?months=${option}`}
                className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-transform duration-150 motion-reduce:transition-none ${
                  isActive
                    ? 'border-neo-text-primary bg-neo-primary text-white shadow-[4px_4px_0px_0px_rgba(20,43,51,0.35)]'
                    : 'border-neo-border bg-white text-neo-text-primary hover:-translate-y-0.5'
                }`}
              >
                Last {option} months
              </Link>
            );
          })}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Total users"
          value={adminData.overview.totalUsers}
          helper="All registered accounts across roles"
          testId="admin-metric-users"
        />
        <DashboardMetricCard
          title="Total listings"
          value={adminData.overview.totalListings}
          helper="Published, pending, and draft inventory"
          testId="admin-metric-listings"
        />
        <DashboardMetricCard
          title="Reviews"
          value={adminData.overview.totalReviews}
          helper="Approved reviews captured across the directory"
          testId="admin-metric-reviews"
        />
        <DashboardMetricCard
          title="Pending moderation"
          value={adminData.overview.pendingModeration}
          helper="Items currently waiting for admin review"
          tone="accent"
          testId="admin-metric-moderation"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <DashboardTrendChart
          title="Growth timeline"
          description="Monthly creation trends for users, listings, reviews, and new moderation pressure."
          data={adminData.monthly}
          series={[
            {
              dataKey: 'usersCreated',
              label: 'Users',
              color: dashboardChartPalette.primary,
            },
            {
              dataKey: 'listingsCreated',
              label: 'Listings',
              color: dashboardChartPalette.secondary,
            },
            {
              dataKey: 'reviewsCreated',
              label: 'Reviews',
              color: dashboardChartPalette.accent,
              type: 'area',
            },
            {
              dataKey: 'pendingModeration',
              label: 'Moderation',
              color: dashboardChartPalette.highlight,
            },
          ]}
          testId="admin-growth-chart"
        />

        <DashboardDonutChart
          title="User role mix"
          description="Current distribution of admin, editor, venue owner, and explorer accounts."
          data={roleBreakdown}
          testId="admin-role-chart"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <DashboardBreakdownChart
          title="Listing workflow state"
          description="How the current inventory is spread across publishing states and featured placements."
          data={listingBreakdown}
          testId="admin-listing-chart"
        />

        <div className="neo-card rounded-3xl bg-neo-surface/80 p-6 shadow-[10px_10px_0px_0px_rgba(20,43,51,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neo-text-tertiary">
            Quick actions
          </p>
          <div className="mt-4 grid gap-3">
            {[
              {
                href: '/admin/users',
                label: 'Review users',
                helper: `${adminData.overview.weeklySignups} signups in the last 7 days`,
              },
              {
                href: '/admin/listings',
                label: 'Triage listings',
                helper: `${adminData.listingStatusBreakdown.pending} listings still pending`,
              },
              {
                href: '/admin/settings',
                label: 'Adjust controls',
                helper: 'Maintenance, moderation, and workspace settings',
              },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border-2 border-neo-border bg-white px-4 py-4 transition-transform duration-150 motion-reduce:transition-none hover:-translate-y-0.5"
              >
                <p className="font-semibold text-neo-text-primary">{item.label}</p>
                <p className="mt-1 text-sm text-neo-text-secondary">{item.helper}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="neo-card rounded-3xl bg-white/95 p-6 shadow-[10px_10px_0px_0px_rgba(20,43,51,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-neo-border/60 pb-4">
          <div>
            <h3 className="heading-sm text-neo-text-primary">Moderation queue</h3>
            <p className="text-sm text-neo-text-secondary">
              The most recent items that still need admin attention.
            </p>
          </div>
          <span className="rounded-full border-2 border-neo-border bg-neo-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neo-text-secondary">
            {adminData.moderationQueue.length} open items
          </span>
        </div>

        <div className="mt-4 space-y-3" data-testid="admin-moderation-queue">
          {adminData.moderationQueue.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-neo-border/60 bg-neo-surface/30 px-4 py-6 text-sm text-neo-text-secondary">
              No pending moderation items right now.
            </p>
          ) : (
            adminData.moderationQueue.map(item => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border-2 border-neo-border/60 bg-neo-surface/35 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
              >
                <div>
                  <p className="font-semibold text-neo-text-primary">{item.itemName}</p>
                  <p className="text-sm text-neo-text-secondary">
                    {item.itemType} • {item.reports} report{item.reports === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-neo-text-secondary">
                  {item.status}
                </span>
                <span className="text-sm text-neo-text-secondary">
                  {formatQueueDate(item.lastActivity)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
