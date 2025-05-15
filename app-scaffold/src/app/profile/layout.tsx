// Profile page layout
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const metadata = {
  title: 'Profile - Eco-Friendly Digital Nomads',
  description: 'Manage your profile on the Sustainable Eco-Friendly Digital Nomads Directory',
};

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/signin?callbackUrl=/profile');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
      {children}
    </div>
  );
}
