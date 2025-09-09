export const dynamic = 'force-static';

import type { Metadata } from 'next';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
   <main className="container mx-auto px-4 py-16" data-testid="admin-dashboard">
      <h1 className="heading-lg mb-4" data-testid="admin-dashboard-title">Admin Dashboard</h1>
      <p className="text-neo-text-secondary">
        This is a placeholder dashboard for tests. Admin features are under construction.
      </p>
    </main>
  );
}
