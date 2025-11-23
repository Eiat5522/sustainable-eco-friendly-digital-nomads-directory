"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: string;
  initialData: {
    name: string;
    email: string;
    bio?: string;
    image?: string;
  };
}

export default function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();
  const { update: updateSession } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      bio: initialData.bio || '',
      image: initialData.image || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Update user profile via API
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update NextAuth session to reflect changes
      await updateSession({
        user: {
          name: data.name,
          image: data.image,
        },
      });

      setSuccess(true);
      router.refresh(); // Refresh the page to show updated data
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Profile updated successfully!
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <div className="mt-1">
            <input
              id="name"
              type="text"
              disabled={isLoading}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email (read-only)
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              value={initialData.email}
              disabled
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
              readOnly
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed for security reasons.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            Profile Image URL
          </label>
          <div className="mt-1">
            <input
              id="image"
              type="url"
              disabled={isLoading}
              placeholder="https://example.com/your-image.jpg"
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                errors.image ? 'border-red-300' : 'border-gray-300'
              }`}
              {...register('image')}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL to an image. Leave blank to use default avatar.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <div className="mt-1">
            <textarea
              id="bio"
              disabled={isLoading}
              rows={4}
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                errors.bio ? 'border-red-300' : 'border-gray-300'
              }`}
              {...register('bio')}
            ></textarea>
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Tell others about yourself. This will be displayed on your public profile.
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
