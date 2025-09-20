export const dynamic = 'force-static';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

const analyticsHighlights = [
  { id: 'active-members', title: 'Active members', value: '12,450', change: '+5.2%' },
  { id: 'listings-in-review', title: 'Listings awaiting review', value: '132', change: '-12%' },
  { id: 'new-signups', title: 'Weekly signups', value: '486', change: '+8.4%' },
  { id: 'support-queue', title: 'Open support requests', value: '27', change: '-3' },
];

export default function AdminDashboardPage() {
  return (
    <main className="container mx-auto space-y-12 px-4 py-16" data-testid="admin-dashboard">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="heading-lg">Admin Dashboard</h1>
          <p className="max-w-3xl text-base text-neo-text-secondary">
            Monitor community health and moderate member activity.
          </p>
        </div>
        <div className="neo-card flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-6 backdrop-blur lg:w-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-neo-text-secondary">Last refresh</p>
          <p className="text-2xl font-semibold">12 minutes ago</p>
        </div>
      </header>

      <section className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {analyticsHighlights.map((h) => (
            <article key={h.id} className="neo-card rounded-2xl bg-white/90 p-6">
              <h3 className="text-sm font-semibold text-neo-text-secondary">{h.title}</h3>
              <p className="mt-2 text-3xl font-semibold text-neo-text-primary">{h.value}</p>
              <p className="text-sm text-neo-text-secondary mt-2">{h.change}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
export const dynamic = 'force-static';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

type ChangeTone = 'positive' | 'negative' | 'neutral';

const changeToneStyles: Record<ChangeTone, string> = {
  positive: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  negative: 'text-rose-700 bg-rose-50 border border-rose-200',
  neutral: 'text-sky-700 bg-sky-50 border border-sky-200',
};

const analyticsHighlights = [
  {
    id: 'active-members',
    title: 'Active members',
    value: '12,450',
    change: { value: '+5.2%', tone: 'positive' as ChangeTone, label: 'vs. last 30 days' },
    insight: 'Engagement peaks on Tuesdays and Thursdays.',
  },
  {
    id: 'listings-in-review',
    title: 'Listings awaiting review',
    value: '132',
    change: { value: '-12%', tone: 'negative' as ChangeTone, label: 'week-over-week' },
    insight: 'Most pending updates relate to amenity adjustments.',
  },
  {
    id: 'new-signups',
    title: 'Weekly signups',
    value: '486',
    change: { value: '+8.4%', tone: 'positive' as ChangeTone, label: '7-day trend' },
    insight: 'Referrals now drive 31% of new members.',
  },
  {
    id: 'support-queue',
    title: 'Open support requests',
    value: '27',
    change: { value: '-3 tickets', tone: 'neutral' as ChangeTone, label: 'since yesterday' },
    insight: 'Response time holds at 2h 11m median.',
  },
];

const engagementMetrics = [
  { id: 'profile-completion', label: 'Profile completion', value: 92 },
  { id: 'returning-hosts', label: 'Returning eco-hosts', value: 68 },
  { id: 'sustainable-badge', label: 'Listings with sustainability badge', value: 74 },
  { id: 'verified-identities', label: 'Verified identities', value: 88 },
];

const trafficSources = [
  { id: 'organic', label: 'Organic search', value: 48, annotation: '+6.1% YoY' },
  { id: 'partner', label: 'Eco partner referrals', value: 27, annotation: '+12 new partners' },
  { id: 'social', label: 'Community social', value: 16, annotation: 'Stable week-over-week' },
  { id: 'direct', label: 'Direct + saved', value: 9, annotation: 'High intent visitors' },
];

const moderationQueue = [
  {
    id: 'aisha-hernandez',
    member: 'Aisha Hernandez',
    role: 'Host',
    concern: 'Photo authenticity check',
    reports: 3,
    lastEvent: '2h ago',
    status: 'Under review',
  },
  {
    id: 'bruno-igawa',
    member: 'Bruno Igawa',
    role: 'Guest',
    concern: 'Payment dispute resolved',
    reports: 1,
    lastEvent: '5h ago',
    status: 'Ready to close',
  },
  {
    id: 'noor-rahman',
    member: 'Noor Rahman',
    role: 'Host',
    concern: 'Accessibility compliance',
    reports: 4,
    lastEvent: '1d ago',
    status: 'Awaiting response',
  },
  {
    id: 'zoe-mateus',
    member: 'Zoé Mateus',
    role: 'Guest',
    concern: 'Community conduct',
    reports: 2,
    lastEvent: '3d ago',
    status: 'Escalated',
  },
];

const statusToneStyles: Record<string, string> = {
  'Under review': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Ready to close': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Awaiting response': 'bg-sky-50 text-sky-700 border border-sky-200',
  Escalated: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const automationOptions = [
  {
    id: 'verify-hosts',
    title: 'Schedule identity re-verification',
    description: 'Reconfirm documents for hosts whose verification expires within 14 days.',
  },
  {
    id: 'refresh-stats',
    title: 'Refresh sustainability metrics',
    description: 'Trigger greenhouse gas and water usage updates for listings flagged as outdated.',
  },
  {
    id: 'archive-dormant',
    title: 'Archive dormant listings',
    description: 'Archive listings inactive for 90+ days after notifying the host.',
  },
];

const communicationSegments = [
  { id: 'new-members', label: 'New members (joined < 30 days)', recipients: 183 },
  { id: 'hosts-updated', label: 'Hosts with pending updates', recipients: 42 },
  { id: 'guests-reviews', label: 'Guests awaiting review follow-up', recipients: 97 },
];

export default function AdminDashboardPage() {
  return (
    <main
      className="container mx-auto space-y-12 px-4 py-16"
      data-testid="admin-dashboard"
    >
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="heading-lg" data-testid="admin-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="max-w-3xl text-base text-neo-text-secondary">
            Monitor community health, moderate member activity, and run platform-wide operations in
            one place. Metrics refresh every 10 minutes to help the sustainability team respond
            quickly without leaving the dashboard.
          </p>
        </div>
        <div className="neo-card flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-6 backdrop-blur lg:w-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-neo-text-secondary">
            Last refresh
          </p>
          <p className="text-2xl font-semibold text-neo-text-primary">12 minutes ago</p>
          <button
            type="button"
            className="neo-button neo-button-hover inline-flex items-center justify-center rounded-xl bg-neo-secondary px-4 py-2 text-sm"
          >
            Download latest report
          </button>
        </div>
      </header>

      <section className="space-y-8" aria-labelledby="analytics-overview" data-testid="analytics-overview">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="analytics-overview" className="text-2xl font-semibold text-neo-text-primary">
              Analytics overview
            </h2>
            <p className="text-sm text-neo-text-secondary">
              At-a-glance metrics that highlight activity, revenue streams, and sustainability
              adoption.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {analyticsHighlights.map((highlight) => (
            <article
              key={highlight.id}
              className="neo-card flex flex-col gap-4 rounded-2xl bg-white/90 p-6 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-neo-text-secondary">
                    {highlight.title}
                  </h3>
                  <p className="mt-2 text-3xl font-semibold text-neo-text-primary">
                    {highlight.value}
                  </p>
                </div>
                <span
                  className={`${changeToneStyles[highlight.change.tone]} inline-flex rounded-full px-3 py-1 text-sm font-medium`}
                >
                  {highlight.change.value}
                </span>
              </div>
              <p className="text-sm text-neo-text-secondary">{highlight.change.label}</p>
              <p className="text-sm text-neo-text-primary/80">{highlight.insight}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="neo-card rounded-2xl bg-white/90 p-6 backdrop-blur">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neo-text-primary">Engagement quality</h3>
                <p className="text-sm text-neo-text-secondary">
                  Track how members progress through eco-aligned onboarding requirements.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Updated hourly
              </span>
            </header>
            <ul className="space-y-4">
              {engagementMetrics.map((metric) => (
                <li key={metric.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-neo-text-primary">
                    <span>{metric.label}</span>
                    <span>{metric.value}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-neo-primary"
                      style={{ width: `${metric.value}%` }}
                    >
                      <span className="sr-only">{metric.label} completion is {metric.value}%</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="neo-card rounded-2xl bg-white/90 p-6 backdrop-blur">
            <header className="mb-4">
              <h3 className="text-lg font-semibold text-neo-text-primary">Traffic & city spotlight</h3>
              <p className="text-sm text-neo-text-secondary">
                Understand where eco-curious travelers find us and which hubs gain momentum.
              </p>
            </header>
            <div className="space-y-6">
              <ul className="space-y-3">
                {trafficSources.map((source) => (
                  <li key={source.id} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-neo-text-primary">{source.label}</p>
                      <p className="text-xs text-neo-text-secondary">{source.annotation}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-neo-text-primary">
                      {source.value}%
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                <h4 className="text-sm font-semibold text-neo-text-primary">Top eco-city momentum</h4>
                <p className="mt-1 text-xs text-neo-text-secondary">
                  Lisbon, Chiang Mai, and Buenos Aires lead bookings with 18% average occupancy lift
                  after sustainability workshops.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="moderation-tools" data-testid="moderation-tools">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 id="moderation-tools" className="text-2xl font-semibold text-neo-text-primary">
              User moderation queue
            </h2>
            <p className="text-sm text-neo-text-secondary">
              Review reported activity and coordinate actions across the support and trust teams.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neo-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide">
              6 tasks assigned
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide">
              SLA: 8h
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-neo-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-3">Member</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Concern</th>
                <th scope="col" className="px-4 py-3">Reports</th>
                <th scope="col" className="px-4 py-3">Last activity</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moderationQueue.map((entry) => (
                <tr key={entry.id} className="bg-white/70">
                  <td className="px-4 py-4 text-sm font-medium text-neo-text-primary">
                    {entry.member}
                  </td>
                  <td className="px-4 py-4 text-sm text-neo-text-secondary">{entry.role}</td>
                  <td className="px-4 py-4 text-sm text-neo-text-secondary">{entry.concern}</td>
                  <td className="px-4 py-4 text-sm text-neo-text-primary">{entry.reports}</td>
                  <td className="px-4 py-4 text-sm text-neo-text-secondary">{entry.lastEvent}</td>
                  <td className="px-4 py-4">
                    <span className={`${statusToneStyles[entry.status]} inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="neo-button neo-button-hover rounded-lg bg-white px-3 py-1 text-xs"
                      >
                        Notes
                      </button>
                      <button
                        type="button"
                        className="neo-button neo-button-hover rounded-lg
                        onClick={() => handleRestrict(entry.id)}
                        aria-label={`Restrict ${entry.member}`} bg-emerald-400/80 px-3 py-1 text-xs text-white"
                      >
                        Approve
                      </button>
                        onClick={() => handleApprove(entry.id)}
                        aria-label={`Approve ${entry.member}`}bg-rose-500 px-3 py-1 text-xs text-white"
                      >
                        Restrict
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-8" aria-labelledby="bulk-operations" data-testid="bulk-operations">
        <div className="flex flex-col gap-2">
          <h2 id="bulk-operations" className="text-2xl font-semibold text-neo-text-primary">
            Bulk operations & communication
          </h2>
          <p className="text-sm text-neo-text-secondary">
            Queue up large-scale updates while Sanity Studio handles content. These tools streamline
            compliance, messaging, and sustainability outreach.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="neo-card flex flex-col gap-4 rounded-2xl bg-white/90 p-6 backdrop-blur">
            <header>
              <h3 className="text-lg font-semibold text-neo-text-primary">Automated actions</h3>
              <p className="text-sm text-neo-text-secondary">
                Select workflow automations to run on the next maintenance window.
              </p>
            </header>
  const handleAutomationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement automation submission logic
    console.log('Submitting automation form');
  };

            <form className="space-y-4" onSubmit={handleAutomationSubmit}>
              {automationOptions.map((option) => (
                <label key={option.id} className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm">
                  <input
                    type="checkbox"
                    name="automation-options"
                    value={option.id}
  const handleAutomationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement automation option change logic
    console.log('Automation option changed:', e.target.value, e.target.checked);
  };

  <input
    type="checkbox"
    name="automation-options"
    value={option.id}
    onChange={handleAutomationChange}
    className="mt-1 h-5 w-5 rounded border-2 border-neo-border"
  />
                    className="mt-1 h-5 w-5 rounded border-2 border-neo-border"
                  />
                  <span>
                    <span className="block font-semibold text-neo-text-primary">{option.title}</span>
                    <span className="mt-1 block text-neo-text-secondary">{option.description}</span>
                  </span>
                </label>
              ))}
              <button
                type="submit"
                className="neo-button neo-button-hover w-full rounded-xl bg-neo-primary px-4 py-2 text-sm text-white"
              >
                Queue selected automations
              </button>
            </form>
          </article>

          <article className="neo-card flex flex-col gap-4 rounded-2xl bg-white/90 p-6 backdrop-blur">
            <header>
              <h3 className="text-lg font-semibold text-neo-text-primary">Bulk messaging</h3>
              <p className="text-sm text-neo-text-secondary">
                Notify specific member segments about upcoming policy or sustainability updates.
              </p>
            </header>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neo-text-primary" htmlFor="segment">
                  Audience segment
                </label>
                <select
                  id="segment"
                  name="segment"
                  className="neo-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a segment
                  </option>
                  {communicationSegments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.label} • {segment.recipients} recipients
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neo-text-primary" htmlFor="message-subject">
                  Subject
                </label>
                <input
                  id="message-subject"
                  name="message-subject"
                  type="text"
                  className="neo-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="Share your sustainability pledge updates"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neo-text-primary" htmlFor="message-body">
                  Message
                </label>
                <textarea
                  id="message-body"
                  name="message-body"
                  rows={5}
                  className="neo-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="Draft the announcement you would like to send..."
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neo-text-secondary">
                <span>Include carbon offset tips attachment</span>
                <label className="inline-flex items-center gap-2 font-medium text-neo-text-primary">
                  <input type="checkbox" className="h-4 w-4 rounded border-2 border-neo-border" />
                  Add sustainability toolkit PDF
                </label>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  className="neo-button neo-button-hover rounded-xl bg-white px-4 py-2 text-sm"
                >
                  Save as template
                </button>
                <button
                  type="button"
                  className="neo-button neo-button-hover rounded-xl bg-neo-primary px-4 py-2 text-sm text-white"
                >
                  Send preview
                </button>
              </div>
            </form>
          </article>
        </div>
      </section>
    </main>
  );
}
