
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VenueListingForm } from '@/app/dashboard/components/VenueListingForm';

export default function NewListingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data) => {
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
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add New Listing</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <VenueListingForm onSave={handleSave} />
    </div>
  );
}
