'use client';

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import type { UserRole } from '@/types/auth';
import {
  fetchJsonWithRetry,
  getDefaultTimeout,
  RequestTimeoutError,
} from '@/lib/http/request';
import { getUserFacingMessage } from '@/lib/error-handler';

type UserListItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  createdAt: string;
  lastActiveAt: string | null;
  status: 'active' | 'inactive';
};

type UserManagementTableProps = {
  currentUserRole: 'admin' | 'superAdmin';
  currentUserId: string;
};

type UsersResponse = {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search: string | null;
    role: UserRole | null;
  };
};

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'user', label: 'User', description: 'Basic user with limited permissions' },
  { value: 'venueOwner', label: 'Venue Owner', description: 'Can manage own listings' },
  { value: 'editor', label: 'Editor', description: 'Can edit content and listings' },
  { value: 'contentEditor', label: 'Content Editor', description: 'Can create and edit content' },
  { value: 'moderator', label: 'Moderator', description: 'Can moderate content' },
  { value: 'admin', label: 'Admin', description: 'Full admin privileges' },
  { value: 'superAdmin', label: 'Super Admin', description: 'Highest level access' },
];

async function fetchUsers(page: number, search: string, roleFilter: UserRole | null): Promise<UsersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
  });

  if (search) params.append('search', search);
  if (roleFilter) params.append('role', roleFilter);

  return fetchJsonWithRetry<UsersResponse>(`/api/admin/users?${params}`, undefined, {
    timeoutMs: getDefaultTimeout(),
    retries: 2,
  });
}

async function updateUser(userId: string, updates: { role?: UserRole; status?: 'active' | 'inactive' }) {
  return fetchJsonWithRetry<{ message: string }>('/api/admin/users', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, ...updates }),
  }, {
    timeoutMs: getDefaultTimeout(),
    retries: 2,
  });
}

async function deleteUser(userId: string) {
  return fetchJsonWithRetry<{ message: string }>('/api/admin/users', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  }, {
    timeoutMs: getDefaultTimeout(),
    retries: 2,
  });
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Unknown';

  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours <= 0) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

function RoleBadge({ role }: { role: UserRole }) {
  const roleColors: Record<UserRole, string> = {
    user: 'bg-gray-50 text-gray-700 border-gray-200',
    venueOwner: 'bg-blue-50 text-blue-700 border-blue-200',
    editor: 'bg-green-50 text-green-700 border-green-200',
    contentEditor: 'bg-teal-50 text-teal-700 border-teal-200',
    moderator: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-red-50 text-red-700 border-red-200',
    superAdmin: 'bg-red-100 text-red-800 border-red-300',
    unidentifiedUser: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  const roleLabels: Record<UserRole, string> = {
    user: 'User',
    venueOwner: 'Venue Owner',
    editor: 'Editor',
    contentEditor: 'Content Editor',
    moderator: 'Moderator',
    admin: 'Admin',
    superAdmin: 'Super Admin',
    unidentifiedUser: 'Unidentified',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[role]}`}>
      {roleLabels[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

export function UserManagementTable({ currentUserRole, currentUserId }: UserManagementTableProps) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canChangeRoles = currentUserRole === 'superAdmin';

  const loadUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchUsers(page, search, roleFilter || null);
        setUsers(response.users);
        setPagination(response.pagination);
      } catch (err) {
        const timeoutMessage = err instanceof RequestTimeoutError
          ? 'Loading users is taking longer than expected. Please try again.'
          : undefined;
        setError(timeoutMessage ?? getUserFacingMessage(err, 'Failed to load users'));
      } finally {
        setLoading(false);
      }
    },
    [roleFilter, search]
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!canChangeRoles) {
      setFeedback('Only Super Admins can change user roles');
      return;
    }

    if (userId === currentUserId && currentUserRole === 'superAdmin' && newRole !== 'superAdmin') {
      setFeedback('Cannot change your own Super Admin role');
      return;
    }

    startTransition(async () => {
      try {
        await updateUser(userId, { role: newRole });
        setFeedback(`User role updated to ${newRole}`);
        await loadUsers(pagination.page);
        
        // Clear feedback after 3 seconds
        setTimeout(() => setFeedback(null), 3000);
      } catch (err) {
        setFeedback(getUserFacingMessage(err, 'Failed to update user role'));
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  };

  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive') => {
    startTransition(async () => {
      try {
        await updateUser(userId, { status: newStatus });
        setFeedback(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        await loadUsers(pagination.page);
        
        // Clear feedback after 3 seconds
        setTimeout(() => setFeedback(null), 3000);
      } catch (err) {
        setFeedback(getUserFacingMessage(err, 'Failed to update user status'));
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  };

  const handleDeleteUser = (userId: string, userName: string | null) => {
    if (!canChangeRoles) {
      setFeedback('Only Super Admins can delete users');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    if (userId === currentUserId) {
      setFeedback('You cannot delete your own account');
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    const displayName = userName || 'this user';
    if (!window.confirm(`Are you sure you want to permanently delete ${displayName}? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteUser(userId);
        setFeedback('User deleted successfully');
        await loadUsers(pagination.page);
        setTimeout(() => setFeedback(null), 3000);
      } catch (err) {
        setFeedback(getUserFacingMessage(err, 'Failed to delete user'));
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  };

  return (
    <div className="space-y-6 p-6">
      {feedback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded" role="status">
          {feedback}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label htmlFor="search" className="sr-only">
              Search users
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="roleFilter" className="sr-only">
              Filter by role
            </label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All roles</option>
              {ROLE_OPTIONS.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {pagination.totalCount} users total
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading users...</div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No users found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} data-testid={`user-row-${user.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canChangeRoles ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            disabled={isPending || (user.id === currentUserId && user.role === 'superAdmin')}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          >
                            {ROLE_OPTIONS.map(role => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={user.role} />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimeAgo(user.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                            disabled={isPending || user.id === currentUserId}
                            className={`text-sm ${
                              user.status === 'active'
                                ? 'text-red-600 hover:text-red-700 disabled:text-red-300'
                                : 'text-green-600 hover:text-green-700 disabled:text-green-300'
                            }`}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          {canChangeRoles && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={isPending || user.id === currentUserId}
                              className="text-sm text-rose-600 hover:text-rose-700 disabled:text-rose-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => loadUsers(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadUsers(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => loadUsers(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage || loading}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <span className="sr-only">Previous</span>
                      ←
                    </button>
                    <button
                      onClick={() => loadUsers(pagination.page + 1)}
                      disabled={!pagination.hasNextPage || loading}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <span className="sr-only">Next</span>
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
