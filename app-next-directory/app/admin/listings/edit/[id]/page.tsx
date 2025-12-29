'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import {
  NeoCard,
  NeoCardContent,
  NeoCardDescription,
  NeoCardHeader,
  NeoCardTitle,
} from '@/components/ui/neo-card';
import type { ListingFormValues } from '../../../../dashboard/components/VenueListingForm';
import { VenueListingForm } from '../../../../dashboard/components/VenueListingForm';

export default function AdminEditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idParam = params?.id;
  const listingId = Array.isArray(idParam) ? idParam[0] : idParam;
  const [listing, setListing] = useState<(ListingFormValues & Record<string, unknown>) | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (listingId) {
      const fetchListing = async () => {
        try {
          const response = await fetch(`/api/listings/manage/${listingId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch listing');
          }
          const data = (await response.json()) as ListingFormValues & Record<string, unknown>;
          setListing(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchListing();
    }
  }, [listingId]);

  const handleSave = async (data: ListingFormValues & Record<string, unknown>) => {
    setSaving(true);
    try {
      if (!listingId) {
        throw new Error('Listing identifier is missing');
      }
      const response = await fetch(`/api/listings/manage/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update listing');
      }

      router.push('/admin/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-tertiary">
              Admin workspace
            </p>
            <h1 className="heading-xl text-neo-text-primary">Edit Listing</h1>
            <p className="text-sm text-neo-text-secondary">
              Update details, amenities, and sustainability highlights.
            </p>
          </div>
          <NeoButton asChild variant="secondary" className="shadow-[4px_4px_0px_0px_#0f172a]">
            <Link href="/admin/listings">Back to listings</Link>
          </NeoButton>
        </header>

        <NeoCard
          variant="elevated"
          className="border-4 border-neo-border bg-white/95 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.3)]"
        >
          <NeoCardHeader className="space-y-2">
            <NeoCardTitle>Listing details</NeoCardTitle>
            <NeoCardDescription className="text-sm text-neo-text-secondary">
              Keep listing information up to date for the community.
            </NeoCardDescription>
          </NeoCardHeader>
          <NeoCardContent className="space-y-6">
            {error && (
              <div className="rounded-2xl border-4 border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
            {listing && <VenueListingForm listing={listing} onSave={handleSave} saving={saving} />}
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  );
}
