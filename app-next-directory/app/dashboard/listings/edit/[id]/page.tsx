
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { VenueListingForm } from '../../../components/VenueListingForm';
import type { ListingFormValues } from '../../../components/VenueListingForm';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();gl
  const listingId = Array.isArray(idParam) ? idParam[0] : idParam;
  const [listing, setListing] = useState<(ListingFormValues & Record<string, unknown>) | null>(null);
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

      router.push('/dashboard/listings');
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {listing && <VenueListingForm listing={listing} onSave={handleSave} saving={saving} />}
    </div>
  );
}
