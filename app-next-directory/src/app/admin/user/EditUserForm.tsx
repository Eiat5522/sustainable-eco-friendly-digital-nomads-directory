'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { validateUserData, type User } from '../users/data';

interface EditUserFormProps {
  user: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export default function EditUserForm({ user, onSave, onCancel }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Check if form has been modified
    const hasChanges =
      formData.name !== user.name ||
      formData.email !== user.email ||
      formData.role !== user.role ||
      formData.status !== user.status;
    setIsDirty(hasChanges);
  }, [formData, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validation = validateUserData(formData);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (!isDirty) {
      setErrors(['No changes detected']);
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      const updatedUser: User = {
        ...user,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      onSave(updatedUser);
    } catch (error) {
      setErrors(['Failed to update user. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleReset = () => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setErrors([]);
    setIsDirty(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <ul className="list-disc list-inside text-sm text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name *
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter user name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter user email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Role *
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
          >
            <option value="user">User</option>
            <option value="venueOwner">Venue Owner</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={isSubmitting || !isDirty}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          User Information
        </h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-600">User ID:</dt>
          <dd className="text-gray-900 font-mono">{user.id}</dd>
          <dt className="text-gray-600">Created:</dt>
          <dd className="text-gray-900">
            {new Date(user.createdAt).toLocaleDateString()}
          </dd>
          <dt className="text-gray-600">Listings:</dt>
          <dd className="text-gray-900">{user.listingsCount}</dd>
          <dt className="text-gray-600">Reviews:</dt>
          <dd className="text-gray-900">{user.reviewsCount}</dd>
          {user.lastLogin && (
            <>
              <dt className="text-gray-600">Last Login:</dt>
              <dd className="text-gray-900">
                {new Date(user.lastLogin).toLocaleDateString()}
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
