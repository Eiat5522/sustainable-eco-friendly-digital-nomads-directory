import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { VenueListingManagement } from '../components/VenueListingManagement';

export default async function VenueListingsPage() {
  let _h = null as null | ReturnType<typeof headers> | { get(name: string): string | null | undefined };
  try {
    _h = headers();
  } catch {
    _h = null;
  }

  const session = await auth(_h);
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
      <VenueListingManagement />
    </div>
  );
}

