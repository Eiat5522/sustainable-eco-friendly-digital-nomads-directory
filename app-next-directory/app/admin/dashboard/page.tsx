export const dynamic = 'force-static'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
}

type Highlight = { id: string; title: string; value: string; change: string }
const analyticsHighlights: Highlight[] = [
  { id: 'active-members', title: 'Active members', value: '12,450', change: '+5.2%' },
  { id: 'listings-in-review', title: 'Listings awaiting review', value: '132', change: '-12%' },
  { id: 'new-signups', title: 'Weekly signups', value: '486', change: '+8.4%' },
  { id: 'support-queue', title: 'Open support requests', value: '27', change: '-3' },
]

type QueueEntry = {
  id: string
  member: string
  role: string
  concern: string
  reports: number
  lastEvent: string
  status: 'Under review' | 'Ready to close' | 'Awaiting response' | 'Escalated'
}

const moderationQueue: QueueEntry[] = [
  { id: 'aisha-hernandez', member: 'Aisha Hernandez', role: 'Host', concern: 'Photo authenticity check', reports: 3, lastEvent: '2h ago', status: 'Under review' },
  { id: 'bruno-igawa', member: 'Bruno Igawa', role: 'Guest', concern: 'Payment dispute resolved', reports: 1, lastEvent: '5h ago', status: 'Ready to close' },
  { id: 'noor-rahman', member: 'Noor Rahman', role: 'Host', concern: 'Accessibility compliance', reports: 4, lastEvent: '1d ago', status: 'Awaiting response' },
  { id: 'zoe-mateus', member: 'Zoé Mateus', role: 'Guest', concern: 'Community conduct', reports: 2, lastEvent: '3d ago', status: 'Escalated' },
]

const statusToneStyles: Record<QueueEntry['status'], string> = {
  'Under review': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Ready to close': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Awaiting response': 'bg-sky-50 text-sky-700 border border-sky-200',
  Escalated: 'bg-rose-50 text-rose-700 border border-rose-200',
}

export default function AdminDashboardPage() {
  return (
    <main className="container mx-auto space-y-12 px-4 py-16" data-testid="admin-dashboard">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <h1 className="heading-lg" data-testid="admin-dashboard-title">Admin Dashboard</h1>
          <p className="max-w-3xl text-base text-neo-text-secondary">
            Monitor community health and moderate member activity.
          </p>
        </div>
        <div className="neo-card flex w-full flex-col gap-3 rounded-2xl bg-white/90 p-6 backdrop-blur lg:w-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-neo-text-secondary">Last refresh</p>
          <p className="text-2xl font-semibold text-neo-text-primary">12 minutes ago</p>
        </div>
      </header>

      <section className="space-y-8" aria-labelledby="analytics-overview" data-testid="analytics-overview">
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

      <section className="space-y-6" aria-labelledby="moderation-tools" data-testid="moderation-tools">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 id="moderation-tools" className="text-2xl font-semibold text-neo-text-primary">User moderation queue</h2>
            <p className="text-sm text-neo-text-secondary">Review reported activity and coordinate actions across the support and trust teams.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neo-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide">6 tasks assigned</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide">SLA: 8h</span>
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
                  <td className="px-4 py-4 text-sm font-medium text-neo-text-primary">{entry.member}</td>
                  <td className="px-4 py-4 text-sm text-neo-text-secondary">{entry.role}</td>
                  <td className="px-4 py-4 text-sm text-neo-text-secondary">{entry.concern}</td>
                  <td className="px-4 py-4 text-sm text-neo-text-primary">{entry.reports}</td>
                  <td className="px-4 py-4 text-sm text-neo-text-secondary">{entry.lastEvent}</td>
                  <td className="px-4 py-4">
                    <span className={`${statusToneStyles[entry.status]} inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>{entry.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" className="neo-button neo-button-hover rounded-lg bg-white px-3 py-1 text-xs">Notes</button>
                      <button type="button" className="neo-button neo-button-hover rounded-lg bg-emerald-400/80 px-3 py-1 text-xs text-white">Approve</button>
                      <button type="button" className="neo-button neo-button-hover rounded-lg bg-rose-500 px-3 py-1 text-xs text-white">Restrict</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
