import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminDashboardClient from './AdminDashboardClient';



export const metadata: Metadata = {
  title: 'Admin Dashboard',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <AdminDashboardClient />
    </Suspense>
  );
}
