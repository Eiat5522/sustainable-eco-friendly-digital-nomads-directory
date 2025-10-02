'use client';

import { useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoInput } from '@/components/ui/neo-input';
import { Label } from '@/components/ui/label';
import {
  NeoCard,
  NeoCardContent,
  NeoCardHeader,
  NeoCardTitle,
  NeoCardDescription,
} from '@/components/ui/neo-card';
import { Loader2 } from 'lucide-react';

interface ProfileEditFormProps {
  currentName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ currentName = '', onSuccess, onCancel }: ProfileEditFormProps) {
  const [name, setName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    // Create AbortController and set timeout for 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else if (err instanceof Error) {
        setError(err.message || 'An error occurred');
      } else {
        setError('An error occurred');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <NeoCard variant="flat" className="bg-white/95">
      <NeoCardHeader>
        <NeoCardTitle>Edit Profile</NeoCardTitle>
        <NeoCardDescription>
          Update your display name
        </NeoCardDescription>
      </NeoCardHeader>
      <NeoCardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <NeoInput
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              maxLength={120}
              disabled={isLoading}
              aria-describedby="name-description"
            />
            <p id="name-description" className="text-xs text-neo-text-secondary">
              This is the name that will be displayed on your profile
            </p>
          </div>

          {error && (
            <div role="alert" aria-live="polite" className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div role="alert" aria-live="polite" className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
              Profile updated successfully!
            </div>
          )}

          <div className="flex gap-3">
            <NeoButton type="submit" variant="accent" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Save Changes
            </NeoButton>
            {onCancel && (
              <NeoButton type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
                Cancel
              </NeoButton>
            )}
          </div>
        </form>
      </NeoCardContent>
    </NeoCard>
  );
}
