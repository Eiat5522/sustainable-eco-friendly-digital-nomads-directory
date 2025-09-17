'use client';

import { useState } from 'react';
import { Search, Filter, MoreHorizontal, Shield, UserCheck, Ban } from 'lucide-react';

// Mock data - in a real app this would come from your API
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-01-15',
    createdAt: '2023-08-10'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    role: 'editor',
    status: 'active',
    lastLogin: '2024-01-14',
    createdAt: '2023-09-15'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'venueOwner',
    status: 'suspended',
    lastLogin: '2024-01-10',
    createdAt: '2023-07-20'
  }
];

export default function UserManagementTable() {
  const [users] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'superAdmin':
        return 'bg-red-100 text-red-700';
      case 'editor':
        return 'bg-blue-100 text-blue-700';
      case 'venueOwner':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white border-4 border-black rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none appearance-none bg-white"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="editor">Editor</option>
            <option value="venueOwner">Venue Owner</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Login</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {user.lastLogin}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Edit Role">
                      <Shield className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-green-600 hover:bg-green-100 rounded" title="Activate">
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-100 rounded" title="Suspend">
                      <Ban className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="More options">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}