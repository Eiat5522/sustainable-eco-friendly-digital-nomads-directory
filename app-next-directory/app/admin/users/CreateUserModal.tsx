'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { getUserFacingMessage } from '@/lib/client-utils';
import type { UserRole } from '@/types/auth';

type CreateUserModalProps = {
  onUserCreated: () => void;
};

export function CreateUserModal({ onUserCreated }: CreateUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    status: 'active' as 'active' | 'suspended' | 'pending',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setIsOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active',
      });
      onUserCreated();
    } catch (err) {
      setError(getUserFacingMessage(err, 'Failed to create user'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <NeoButton variant="primary" size="sm">
          Add New User
        </NeoButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-neo-surface p-6 rounded-2xl shadow-2xl z-50 border border-neo-border">
          <Dialog.Title className="text-xl font-bold mb-4">Create New User</Dialog.Title>
          <Dialog.Description className="text-neo-text-secondary mb-6">
            Fill in the details below to create a new user account.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <NeoInput
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <NeoInput
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <NeoInput
                id="password"
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full h-12 px-4 py-2 border border-neo-border rounded-lg bg-neo-surface focus:outline-none focus:ring-2 focus:ring-neo-primary"
                >
                  <option value="user">User</option>
                  <option value="venueOwner">Venue Owner</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="superAdmin">Super Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'active' | 'suspended' | 'pending',
                    })
                  }
                  className="w-full h-12 px-4 py-2 border border-neo-border rounded-lg bg-neo-surface focus:outline-none focus:ring-2 focus:ring-neo-primary"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <NeoButton variant="outline" type="button" disabled={loading}>
                  Cancel
                </NeoButton>
              </Dialog.Close>
              <NeoButton variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </NeoButton>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
