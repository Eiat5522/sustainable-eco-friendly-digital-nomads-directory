'use client';

import Link from 'next/link';
import type React from 'react';
import { useCallback, useDeferredValue, useEffect, useRef, useState, useTransition } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { getUserFacingMessage } from '@/lib/client-utils';
import { fetchJsonWithRetry, getDefaultTimeout, RequestTimeoutError } from '@/lib/http/request';
import type { UserRole } from '@/types/auth';
import { CreateUserModal } from './CreateUserModal';
import type { UserListItem, UsersResponse } from './types';

type UserManagementTableProps = {
  currentUserRole: 'admin' | 'superAdmin';
  currentUserId: string;
  initialData?: UsersResponse;
};

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'user', label: 'User', description: 'Basic user with limited permissions' },
  { value: 'venueOwner', label: 'Venue Owner', description: 'Can manage own listings' },
  { value: 'admin', label: 'Admin', description: 'Full admin privileges' },
  { value: 'superAdmin', label: 'Super Admin', description: 'Highest level access' },
];

async function fetchUsers(
  page: number,
  search: string,
  roleFilter: UserRole | null
): Promise<UsersResponse> {
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

async function updateUser(
  userId: string,
  updates: { role?: UserRole; status?: 'active' | 'inactive' }
) {
  return fetchJsonWithRetry<{ message: string }>(
    '/api/admin/users',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ...updates }),
    },
    {
      timeoutMs: getDefaultTimeout(),
      retries: 2,
    }
  );
}

async function deleteUser(userId: string) {
  return fetchJsonWithRetry<{ message: string }>(
    '/api/admin/users',
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    },
    {
      timeoutMs: getDefaultTimeout(),
      retries: 2,
    }
  );
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';

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
    user: 'bg-neo-secondary/70 text-neo-text-primary',
    editor: 'bg-amber-100 text-amber-900',
    venueOwner: 'bg-sky-100 text-sky-900',
    admin: 'bg-rose-100 text-rose-900',
    superAdmin: 'bg-rose-200 text-rose-950',
  };

  const roleLabels: Record<UserRole, string> = {
    user: 'User',
    editor: 'Editor',
    venueOwner: 'Venue Owner',
    admin: 'Admin',
    superAdmin: 'Super Admin',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-neo-border px-3 py-1 text-xs font-semibold ${roleColors[role]}`}
    >
      {roleLabels[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-900',
    inactive: 'bg-slate-200 text-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-neo-border px-3 py-1 text-xs font-semibold ${statusColors[status]}`}
    >
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

export function UserManagementTable({
  currentUserRole,
  currentUserId,
  initialData,
}: UserManagementTableProps) {
  const [users, setUsers] = useState<UserListItem[]>(initialData?.users ?? []);
  const [pagination, setPagination] = useState(
    initialData?.pagination ?? {
      page: 1,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
    }
  );
  const [searchInput, setSearchInput] = useState(initialData?.filters?.search ?? '');
  const search = useDeferredValue(searchInput);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>(initialData?.filters?.role ?? '');
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canChangeRoles = currentUserRole === 'superAdmin';

  const scheduleFeedbackClear = useCallback((delayMs: number) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), delayMs);
  }, []);

  const loadUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchUsers(page, search, roleFilter || null);
        setUsers(response.users);
        setPagination(response.pagination);
      } catch (err) {
        const timeoutMessage =
          err instanceof RequestTimeoutError
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
    if (initialData && pagination.page === 1 && !search && !roleFilter) {
      return;
    }
    loadUsers(1);
  }, [loadUsers, initialData, search, roleFilter, pagination.page]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!canChangeRoles) {
      setFeedback('Only Super Admins can change user roles');
      scheduleFeedbackClear(3000);
      return;
    }

    if (userId === currentUserId && currentUserRole === 'superAdmin' && newRole !== 'superAdmin') {
      setFeedback('Cannot change your own Super Admin role');
      scheduleFeedbackClear(4000);
      return;
    }

    startTransition(async () => {
      try {
        await updateUser(userId, { role: newRole });
        setFeedback(`User role updated to ${newRole}`);
        await loadUsers(pagination.page);
        scheduleFeedbackClear(3000);
      } catch (err) {
        setFeedback(getUserFacingMessage(err, 'Failed to update user role'));
        scheduleFeedbackClear(4000);
      }
    });
  };

  const handleStatusChange = (userId: string, newStatus: 'active' | 'inactive') => {
    if (!canChangeRoles) {
      setFeedback('Only Super Admins can change user status');
      scheduleFeedbackClear(4000);
      return;
    }

    startTransition(async () => {
      try {
        await updateUser(userId, { status: newStatus });
        setFeedback(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        await loadUsers(pagination.page);
        scheduleFeedbackClear(3000);
      } catch (err) {
        setFeedback(getUserFacingMessage(err, 'Unable to update status'));
        scheduleFeedbackClear(4000);
      }
    });
  };

  const handleDeleteUser = (userId: string, userName: string | null) => {
    if (!canChangeRoles) {
      setFeedback('Only Super Admins can delete users');
      scheduleFeedbackClear(4000);
      return;
    }

    if (userId === currentUserId) {
      setFeedback('You cannot delete your own account');
      scheduleFeedbackClear(4000);
      return;
    }

    const displayName = userName || 'this user';
    if (
      !globalThis.confirm(
        `Are you sure you want to permanently delete ${displayName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteUser(userId);
        setFeedback('User deleted successfully');
        await loadUsers(pagination.page);
        scheduleFeedbackClear(3000);
      } catch (err) {
        setFeedback(getUserFacingMessage(err, 'Failed to delete user'));
        scheduleFeedbackClear(4000);
      }
    });
  };

  return (
    <div className="space-y-6" data-testid="admin-users-table">
      {feedback && (
        <output
          className="block rounded-2xl border-4 border-neo-border bg-neo-secondary/40 px-4 py-3 text-sm font-medium text-neo-text-primary"
        >
          {feedback}
        </output>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border-4 border-neo-border bg-white/90 p-4 shadow-[8px_8px_0px_0px_var(--color-neo-shadow)] lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <label htmlFor="search" className="mb-1 block text-xs font-semibold uppercase tracking-wide">
              Search users
            </label>
            <NeoInput
              type="text"
              id="search"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-full md:max-w-xs">
            <label htmlFor="roleFilter" className="mb-1 block text-xs font-semibold uppercase tracking-wide">
              Filter by role
            </label>
            <select
              id="roleFilter"
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setRoleFilter(e.target.value as UserRole | '')
              }
              className="h-12 w-full rounded-lg border-2 border-neo-border bg-neo-surface px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border-2 border-neo-border bg-neo-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neo-text-secondary">
            {pagination.totalCount} users total
          </div>
          <CreateUserModal onUserCreated={() => loadUsers(1)} />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-4 border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border-4 border-neo-border bg-neo-surface/70 px-6 py-10 text-center text-neo-text-secondary">
          Loading users...
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto rounded-2xl border-4 border-neo-border bg-white shadow-[10px_10px_0px_0px_var(--color-neo-shadow)]">
            <table className="min-w-full divide-y-2 divide-neo-border/60">
              <thead className="bg-neo-surface/80 text-left text-xs uppercase tracking-wide text-neo-text-secondary">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Last Active</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neo-border/30 bg-white/95 text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-neo-text-secondary">
                      No users found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  users.map((user: UserListItem) => (
                    <tr key={user.id} data-testid={`user-row-${user.id}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-neo-text-primary">{user.name || 'No name'}</div>
                          <div className="text-xs text-neo-text-secondary">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {canChangeRoles ? (
                          <select
                            value={user.role}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handleRoleChange(user.id, e.target.value as UserRole)
                            }
                            disabled={
                              isPending || (user.id === currentUserId && user.role === 'superAdmin')
                            }
                            className="h-10 rounded-lg border-2 border-neo-border bg-neo-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary disabled:opacity-60"
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
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-neo-text-secondary">
                        {formatTimeAgo(user.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <NeoButton asChild size="sm" variant="outline" className="h-9 px-3">
                            <Link href={`/admin/user/${user.id}`}>Edit</Link>
                          </NeoButton>
                          <NeoButton
                            type="button"
                            size="sm"
                            variant={user.status === 'active' ? 'accent' : 'success'}
                            onClick={() =>
                              handleStatusChange(
                                user.id,
                                user.status === 'active' ? 'inactive' : 'active'
                              )
                            }
                            disabled={isPending || user.id === currentUserId}
                            className="h-9 px-3"
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </NeoButton>
                          {canChangeRoles && (
                            <NeoButton
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={isPending || user.id === currentUserId}
                              className="h-9 border-rose-400 bg-rose-50 px-3 text-rose-700 hover:bg-rose-100"
                            >
                              Delete
                            </NeoButton>
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
            <div className="flex flex-col gap-3 rounded-2xl border-4 border-neo-border bg-white/90 px-4 py-3 shadow-[8px_8px_0px_0px_var(--color-neo-shadow)] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-neo-text-secondary">
                Showing page <span className="font-semibold text-neo-text-primary">{pagination.page}</span>{' '}
                of <span className="font-semibold text-neo-text-primary">{pagination.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <NeoButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => loadUsers(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  aria-label="Previous"
                >
                  Previous
                </NeoButton>
                <NeoButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => loadUsers(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  aria-label="Next"
                >
                  Next
                </NeoButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
