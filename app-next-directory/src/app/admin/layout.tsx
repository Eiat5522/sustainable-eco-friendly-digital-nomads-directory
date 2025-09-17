import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasPagePermission } from '@/types/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Sustainable Nomads Directory',
  description: 'Administrative dashboard for managing listings, users, and content.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.role || !hasPagePermission(session.user.role, 'admin', 'canView')) {
    redirect('/auth/login?callbackUrl=/admin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar userRole={session.user.role} />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <AdminHeader user={session.user} />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}