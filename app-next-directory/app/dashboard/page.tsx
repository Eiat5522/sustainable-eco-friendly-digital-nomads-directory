import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'User Dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardPage(): never {
  redirect('/profile');
}
