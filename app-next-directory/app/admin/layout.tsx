import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import type React from 'react';

import { auth } from '@/lib/auth';

const fallbackLoading = (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="px-6 py-4 text-sm text-gray-500">Loading admin console…</div>
  </div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={fallbackLoading}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/auth/login');
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/listings', label: 'Listings', icon: '📝' },
    { href: '/listings', label: 'Back to Site', icon: '🏠' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              </Link>
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
