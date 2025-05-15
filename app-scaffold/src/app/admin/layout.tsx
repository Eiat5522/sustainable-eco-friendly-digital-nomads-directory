import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard - Eco-Friendly Digital Nomads',
  description: 'Administrator dashboard for Sustainable Eco-Friendly Digital Nomads Directory',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated or not admin
  if (!session || session.user.role !== 'admin') {
    redirect('/auth/unauthorized');
  }

  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <div className="w-64 bg-green-800 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-6">Admin Dashboard</h1>
          <nav className="space-y-1">
            <Link href="/admin" className="block py-2 px-4 rounded hover:bg-green-700">
              Dashboard
            </Link>
            <Link href="/admin/users" className="block py-2 px-4 rounded hover:bg-green-700">
              Users
            </Link>
            <Link href="/admin/listings" className="block py-2 px-4 rounded hover:bg-green-700">
              Listings
            </Link>
            <Link href="/admin/settings" className="block py-2 px-4 rounded hover:bg-green-700">
              Settings
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Admin Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
