'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import {
  NeoCard,
  NeoCardContent,
  NeoCardDescription,
  NeoCardHeader,
  NeoCardTitle,
} from '@/components/ui/neo-card';
import type { ListingFormValues } from '../../components/VenueListingForm';
import { VenueListingForm } from '../../components/VenueListingForm';
export default function NewListingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: ListingFormValues & Record<string, unknown>) => {
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      router.push('/dashboard/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    }
  };

  return (
    <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-tertiary">
              Venue owner workspace
            </p>
            <h1 className="heading-xl text-neo-text-primary">Add New Listing</h1>
            <p className="text-sm text-neo-text-secondary">
              Capture the details that make your space unforgettable for eco-conscious nomads.
            </p>
          </div>
          <NeoButton asChild variant="secondary" className="shadow-[4px_4px_0px_0px_#0f172a]">
            <Link href="/dashboard/listings">Back to listings</Link>
          </NeoButton>
        </header>

        <NeoCard
          variant="elevated"
          className="border-4 border-neo-border bg-white/95 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.3)]"
        >
          <NeoCardHeader className="space-y-2">
            <NeoCardTitle>Listing details</NeoCardTitle>
            <NeoCardDescription className="text-sm text-neo-text-secondary">
              Share the essentials, amenities, and sustainability features your guests care about.
            </NeoCardDescription>
          </NeoCardHeader>
          <NeoCardContent className="space-y-6">
            {error && (
              <div className="rounded-2xl border-4 border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
            <VenueListingForm onSave={handleSave} />
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  );
}
