'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ListingFormValues } from '../../components/listing-form.schema';
import { VenueListingForm } from '../../components/VenueListingForm';

type ListingPayload = ListingFormValues & Record<string, unknown>;

type ListingFormControllerProps = {
  listing?: ListingFormValues | null;
  onSave: (values: ListingPayload) => Promise<unknown>;
  redirectTo: string;
  errorFallback: string;
  options: {
    cities: Array<{ _id: string; name: string }>;
    ecoTags: Array<{ _id: string; name: string }>;
    digitalNomadFeatures: Array<{ _id: string; name: string }>;
    amenities: Array<{ _id: string; name: string }>;
  };
};

export function ListingFormController({
  listing,
  onSave,
  redirectTo,
  errorFallback,
  options,
}: ListingFormControllerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: ListingPayload) => {
    setError(null);
    setSaving(true);
    try {
      await onSave(data);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorFallback);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && (
        <div
          role="alert"
          className="rounded-2xl border-4 border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}
      <VenueListingForm
        listing={listing}
        onSave={handleSave}
        saving={saving}
        cities={options.cities}
        ecoTags={options.ecoTags}
        digitalNomadFeatures={options.digitalNomadFeatures}
        amenities={options.amenities}
      />
    </>
  );
}
