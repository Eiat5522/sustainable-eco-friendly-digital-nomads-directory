import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Users</h2>
          <p className="text-3xl font-bold text-green-600">-</p>
          <p className="text-sm text-gray-500 mt-2">Total registered users</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Listings</h2>
          <p className="text-3xl font-bold text-green-600">-</p>
          <p className="text-sm text-gray-500 mt-2">Active listings</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Reviews</h2>
          <p className="text-3xl font-bold text-green-600">-</p>
          <p className="text-sm text-gray-500 mt-2">Total reviews submitted</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h2>
        <p className="text-gray-500 italic">Activity dashboard will be available soon.</p>
      </div>
    </div>
  );
}
