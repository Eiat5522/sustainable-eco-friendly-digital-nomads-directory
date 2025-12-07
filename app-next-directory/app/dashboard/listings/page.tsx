import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { VenueListingManagement } from '../components/VenueListingManagement';

export default async function VenueListingsPage() {
<<<<<<< HEAD
  let _h = null as
    | null
    | ReturnType<typeof headers>
=======
  // FORTEST: Wrap headers() in try-catch for compatibility with prerender
  let _h = null as
    | null
    | Awaited<ReturnType<typeof headers>>
>>>>>>> 698eec36 (feat(prerender): parameterize helpers to avoid implicit headers() calls in cached scopes (#363))
    | { get(name: string): string | null | undefined };
  try {
    _h = await headers();
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
