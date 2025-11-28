import Link from 'next/link';
import { redirect } from 'next/navigation';
import type React from 'react';
import { Suspense, use } from 'react';
import { auth } from '@/lib/auth';
import type { UserRole } from '@/types/auth';

type SessionUser = { id?: string; role?: UserRole } | undefined;

function ensureAdmin(sessionUser: SessionUser): boolean {
  const role = sessionUser?.role;
  return role === 'admin' || role === 'superAdmin';
}

type AdminLayoutContentProps = {
  sessionUser: { id?: string; role?: UserRole };
  children: React.ReactNode;
};

function AdminLayoutContent({ sessionUser, children }: AdminLayoutContentProps) {
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
              <span className="text-sm text-gray-600">
                {sessionUser?.role === 'superAdmin' ? '👑 Super Admin' : '🔧 Admin'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </div>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const sessionUser = session?.user as SessionUser;

  if (!ensureAdmin(sessionUser)) {
    redirect('/auth/login');
  }

  return <AdminLayoutContent sessionUser={sessionUser} children={children} />;
}
