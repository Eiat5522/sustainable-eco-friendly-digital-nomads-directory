'use client';

import { signOut } from 'next-auth/react';
import { Bell, LogOut, User } from 'lucide-react';

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const handleSignOut = () => {
    void signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white border-b-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Administration
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              {user.image ? (
                <img
                  src={user.image}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border-2 border-gray-300"
                />
              ) : (
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user.name || user.email}
                </p>
                <p className="text-gray-600 capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1 text-gray-600 hover:text-red-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}