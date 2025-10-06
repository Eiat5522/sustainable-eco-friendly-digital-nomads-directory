
import { VenueListingManagement } from '@/app/dashboard/components/VenueListingManagement';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function VenueListingsPage() {
  const session = await auth();
  const sessionUser = session?.user as {
    id?: string;
    role?: string;
  } | undefined;

  if (sessionUser?.role !== 'venueOwner') {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Your Listings</h1>
      <VenueListingManagement />
    </div>
  );
}
