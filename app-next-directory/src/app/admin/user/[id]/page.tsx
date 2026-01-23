'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditUserForm from '../EditUserForm';
import { type User } from '../../users/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface UserEditPageProps {
  params: {
    id: string;
  };
}

export default function UserEditPage({ params }: UserEditPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock user data
      const mockUser: User = {
        id: params.id,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z',
        lastLogin: '2024-12-20T14:30:00Z',
        listingsCount: 3,
        reviewsCount: 12,
      };

      setUser(mockUser);
    } catch (err) {
      setError('Failed to load user. Please try again.');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedUser: User) => {
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update local state
      setUser(updatedUser);

      // Navigate back to users list
      router.push('/admin/users');
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user. Please try again.');
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'User not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            The user you&apos;re looking for doesn&apos;t exist or could not be loaded.
          </p>
          <Button onClick={handleCancel}>Back to Users</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600 mt-2">
            Update user information and permissions
          </p>
        </div>

        <EditUserForm
          user={user}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
