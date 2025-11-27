import { redirect } from 'next/navigation';
import { Suspense } from 'react'; // Add Suspense import
import { auth } from '@/lib/auth';
import { VenueListingManagement } from '../components/VenueListingManagement';

export default async function VenueListingsPage() {
  const session = await auth();
  const sessionUser = session?.user as
    | {
        id?: string;
        role?: string;
      }
    | undefined;

  if (sessionUser?.role !== 'venueOwner') {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Your Listings</h1>
      <Suspense fallback={
        <div className="p-8 text-center text-gray-500">Loading listings...</div>
      }>
        <VenueListingManagement />
      </Suspense>
    </div>
  );
}
