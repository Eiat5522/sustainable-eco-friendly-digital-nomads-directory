import { Suspense } from 'react';
import UserManagementTable from '@/components/admin/UserManagementTable';
import UserStatsCards from '@/components/admin/UserStatsCards';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">
          Manage user accounts, roles, and permissions across the platform.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
        <UserStatsCards />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
        <UserManagementTable />
      </Suspense>
    </div>
  );
}