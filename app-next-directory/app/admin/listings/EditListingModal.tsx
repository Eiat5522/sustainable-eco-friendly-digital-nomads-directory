'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import {
  NeoCard,
  NeoCardContent,
  NeoCardDescription,
  NeoCardHeader,
  NeoCardTitle,
} from '@/components/ui/neo-card';
import { getUserFacingMessage } from '@/lib/client-utils';
import type { ListingFormValues } from '../../../dashboard/components/VenueListingForm';
import { VenueListingForm } from '../../../dashboard/components/VenueListingForm';

type EditListingModalProps = {
  listingId: string;
  listingName: string;
  onUpdated: () => void;
};

type ListingFormState = ListingFormValues & Record<string, unknown>;

type ListingResponse = ListingFormState;

type SaveResponse = { message?: string };

export function EditListingModal({
  listingId,
  listingName,
  onUpdated,
}: EditListingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [listing, setListing] = useState<ListingFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/listings/manage/${listingId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch listing');
        }
        const data = (await response.json()) as ListingResponse;
        setListing(data);
      } catch (err) {
        setError(getUserFacingMessage(err, 'An unexpected error occurred'));
      } finally {
        setLoading(false);
      }
    };

    void fetchListing();
  }, [isOpen, listingId]);

  const handleSave = async (data: ListingFormState) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/listings/manage/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as SaveResponse;
        throw new Error(payload.message ?? 'Failed to update listing');
      }

      onUpdated();
      setIsOpen(false);
    } catch (err) {
      setError(getUserFacingMessage(err, 'An error occurred while saving'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
        if (!open) {
          setError(null);
          setListing(null);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="text-blue-600 hover:text-blue-900"
          title={`Edit ${listingName}`}
        >
          ✎
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,64rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border-4 border-neo-border bg-neo-surface shadow-[12px_12px_0px_0px_rgba(15,23,42,0.35)]">
          <div className="max-h-[90vh] overflow-y-auto px-6 py-8">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-tertiary">
                  Admin workspace
                </p>
                <Dialog.Title className="heading-xl text-neo-text-primary">
                  Edit Listing
                </Dialog.Title>
                <Dialog.Description className="text-sm text-neo-text-secondary">
                  Update details, amenities, and sustainability highlights for {listingName}.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <NeoButton variant="secondary" className="shadow-[4px_4px_0px_0px_#0f172a]">
                  Close
                </NeoButton>
              </Dialog.Close>
            </header>

            <NeoCard
              variant="elevated"
              className="mt-6 border-4 border-neo-border bg-white/95 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.3)]"
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
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-neo-border/60 bg-neo-surface/70 px-6 py-8 text-center text-sm text-neo-text-secondary">
                    Loading listing details...
                  </div>
                ) : (
                  listing && (
                    <VenueListingForm listing={listing} onSave={handleSave} saving={saving} />
                  )
                )}
              </NeoCardContent>
            </NeoCard>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
