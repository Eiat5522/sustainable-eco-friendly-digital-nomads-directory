import ProfileForm from '@/components/auth/ProfileForm';
import { authOptions } from '@/lib/auth';
import { findSanityUserByEmail } from '@/lib/auth/userService';
import { getServerSession } from 'next-auth/next';
import Image from 'next/image';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null; // This should be caught by the layout
  }

  // Get extended user data from Sanity if available
  const sanityUser = session?.user?.email
    ? await findSanityUserByEmail(session.user.email)
    : null;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="md:flex">
        {/* Profile sidebar */}
        <div className="md:w-1/3 p-6 bg-green-50">
          <div className="flex flex-col items-center">
            <div className="relative h-32 w-32 rounded-full overflow-hidden mb-4">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 128px"
                  priority
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-4xl text-white font-semibold">
                    {session.user.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold">{session.user.name}</h2>
            <p className="text-gray-600 mb-2">{session.user.email}</p>
            <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {session.user.role?.charAt(0).toUpperCase() + session.user.role?.slice(1)}
            </div>

            {sanityUser?.bio && (
              <div className="mt-4 text-sm text-gray-600">
                <h3 className="font-medium text-gray-900 mb-1">About</h3>
                <p>{sanityUser.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile content */}
        <div className="md:w-2/3 p-6">
          <h3 className="text-xl font-bold mb-6">Edit Profile</h3>
          <ProfileForm
            userId={session.user.id}
            initialData={{
              name: session.user.name || '',
              email: session.user.email || '',
              bio: sanityUser?.bio || '',
              image: session.user.image || '',
            }}
          />
        </div>
      </div>
    </div>
  );
}
