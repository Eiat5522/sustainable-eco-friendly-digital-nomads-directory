'use client';

import type React from 'react';
import { useState } from 'react';
import type { UserRole } from '@/types/auth';

type InitialUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
};

export function EditUserForm({ initialUser }: { initialUser: InitialUser }) {
  const [role, setRole] = useState<UserRole>(initialUser.role);
  const [status, setStatus] = useState<InitialUser['status']>(initialUser.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const VALID_ROLES: UserRole[] = ['user', 'editor', 'venueOwner', 'admin', 'superAdmin'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: initialUser.id, role, status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update user');
      }

      setSuccess(data?.message || 'User updated');
      // clear success after short delay
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="edit-user-form" className="space-y-4">
      {success && <div className="p-3 bg-green-50 text-green-800 rounded">{success}</div>}
      {error && <div className="p-3 bg-red-50 text-red-800 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <div className="mt-1 text-neo-text-secondary">{initialUser.name ?? '—'}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <div className="mt-1 text-neo-text-secondary">{initialUser.email ?? '—'}</div>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3"
        >
          {VALID_ROLES.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={e => setStatus(e.target.value as InitialUser['status'])}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 px-3"
        >
          <option value="active">active</option>
          <option value="suspended">suspended</option>
          <option value="pending">pending</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <a href="/admin/users" className="text-sm text-gray-600 hover:underline">
          Cancel
        </a>
      </div>
    </form>
  );
}
