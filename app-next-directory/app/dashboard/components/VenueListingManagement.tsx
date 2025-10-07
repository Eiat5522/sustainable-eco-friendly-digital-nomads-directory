
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NeoButton } from '@/components/ui/neo-button';

interface Listing {
  _id: string;
  name: string;
  city: string;
  status: string;
}

export function VenueListingManagement() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings');
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        const data = (await response.json()) as { listings?: unknown };
        const parsed = Array.isArray(data?.listings)
          ? data.listings.filter((listing): listing is Listing =>
              Boolean(
                listing &&
                typeof listing === 'object' &&
                typeof (listing as Listing)._id === 'string' &&
                typeof (listing as Listing).name === 'string' &&
                typeof (listing as Listing).city === 'string' &&
                typeof (listing as Listing).status === 'string'
              )
            )
          : [];
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

        setListings(listings.filter((listing) => listing._id !== id));
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
              <th scope="col" className="px-4 py-3">Listing Name</th>
              <th scope="col" className="px-4 py-3">City</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neo-border/40 bg-white/90">
            {listings.map((listing) => (
              <tr key={listing._id}>
                <td className="px-4 py-4">{listing.name}</td>
                <td className="px-4 py-4">{listing.city}</td>
                <td className="px-4 py-4">{listing.status}</td>
                <td className="px-4 py-4">
                  <NeoButton asChild variant="secondary" size="sm" className="mr-2">
                    <Link href={`/dashboard/listings/edit/${listing._id}`}>Edit</Link>
                  </NeoButton>
                  <NeoButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(listing._id)}
                  >
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
