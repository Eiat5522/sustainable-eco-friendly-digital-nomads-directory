import { redirect } from 'next/navigation';
import type React from 'react';
import { Suspense } from 'react';

import { FooterServer } from '@/components/layout/FooterServer';
import { HeaderServer } from '@/components/layout/HeaderServer';
import { auth } from '@/lib/auth';
import AdminNavigation from './AdminNavigation';

const fallbackLoading = (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="px-6 py-4 text-sm text-neo-text-secondary">Loading admin console…</div>
  </div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={fallbackLoading}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (role !== 'admin' && role !== 'superAdmin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderServer />

      <section className="relative overflow-hidden border-b-4 border-neo-border bg-neo-surface">
        <div className="pointer-events-none absolute -top-20 right-0 h-48 w-48 rounded-full bg-neo-secondary/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-neo-primary/30 blur-3xl" />
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-neo-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neo-text-secondary">
              Admin Console
            </span>
            <h1 className="heading-lg text-neo-text-primary">Admin Panel</h1>
            <p className="body-md">
              Curate listings, manage users, and keep the directory running smoothly in a single,
              unified workspace.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <AdminNavigation />
          <main className="min-w-0 space-y-6">{children}</main>
        </div>
      </div>

      <FooterServer />
    </div>
  );
}
