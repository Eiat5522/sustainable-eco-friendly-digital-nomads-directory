'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import type { ListingManagementSummary } from '@/types/listings';

type ListingsApiPayload = {
  listings?: unknown;
  success?: boolean;
  data?: {
    listings?: unknown;
  };
};

function extractListings(payload: ListingsApiPayload | null | undefined): unknown[] {
  if (payload?.data && Array.isArray(payload.data.listings)) {
    return payload.data.listings;
  }

  if (Array.isArray(payload?.listings)) {
    return payload.listings;
  }

  return [];
}

function toListingManagementSummary(value: unknown): ListingManagementSummary | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id =
    typeof record._id === 'string' ? record._id : typeof record.id === 'string' ? record.id : null;
  const name =
    typeof record.name === 'string'
      ? record.name
      : typeof record.title === 'string'
        ? record.title
        : null;

  if (!id || !name) {
    return null;
  }

  const cityValue = record.city;
  let city: string | null = null;
  if (typeof cityValue === 'string') {
    city = cityValue;
  } else if (
    cityValue &&
    typeof cityValue === 'object' &&
    typeof (cityValue as { name?: unknown }).name === 'string'
  ) {
    city = (cityValue as { name: string }).name;
  }

  const moderation = record.moderation;
  let status: string | null = null;
  if (typeof record.status === 'string') {
    status = record.status;
  } else if (typeof record.moderationStatus === 'string') {
    status = record.moderationStatus;
  } else if (
    moderation &&
    typeof moderation === 'object' &&
    typeof (moderation as { status?: unknown }).status === 'string'
  ) {
    status = (moderation as { status: string }).status;
  } else if (typeof record.verificationStatus === 'string') {
    status = record.verificationStatus;
  }

  if (!city || city.trim().length === 0 || !status || status.trim().length === 0) {
    return null;
  }

  return {
    _id: id,
    name,
    city,
    status,
  } satisfies ListingManagementSummary;
}

export function VenueListingManagement() {
  const [listings, setListings] = useState<ListingManagementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings/manage');
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        const payload = (await response.json()) as ListingsApiPayload;
        const parsed = extractListings(payload)
          .map(toListingManagementSummary)
          .filter((listing): listing is ListingManagementSummary => listing !== null);
        setListings(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        const response = await fetch(`/api/listings/manage/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete listing');
        }

        setListings(listings.filter(listing => listing._id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete listing');
      }
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
      <div className="flex justify-end mb-4">
        <NeoButton asChild>
          <Link href="/dashboard/listings/new">Add New Listing</Link>
        </NeoButton>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neo-border/60 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neo-border/60 text-left text-sm">
          <thead className="bg-neo-surface/80 text-xs uppercase tracking-wide text-neo-text-secondary">
            <tr>
              <th scope="col" className="px-4 py-3">
                Listing Name
              </th>
              <th scope="col" className="px-4 py-3">
                City
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neo-border/40 bg-white/90">
            {listings.map(listing => (
              <tr key={listing._id}>
                <td className="px-4 py-4">{listing.name}</td>
                <td className="px-4 py-4">{listing.city}</td>
                <td className="px-4 py-4">{listing.status}</td>
                <td className="px-4 py-4">
                  <NeoButton asChild variant="secondary" size="sm" className="mr-2">
                    <Link href={`/dashboard/listings/edit/${listing._id}`}>Edit</Link>
                  </NeoButton>
                  <NeoButton variant="outline" size="sm" onClick={() => handleDelete(listing._id)}>
                    Delete
                  </NeoButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
