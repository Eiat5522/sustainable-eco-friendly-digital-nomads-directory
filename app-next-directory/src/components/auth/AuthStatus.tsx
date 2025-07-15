"use client";

import { useState } from 'react';
import { signOut, useSession } from '@auth/nextjs';
import { User } from "@/types/auth";
import Link from 'next/link';
import Image from 'next/image';

export default function AuthStatus() {
  const { data: session, status } = useSession() as { data: { user?: User } | null, status: string };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
    );
  }

  // User is not authenticated
  if (!session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <Link 
          href="/auth/signin" 
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          Sign up
        </Link>
      </div>
    );
  }

  // User is authenticated
  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
          id="user-menu-button"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
        >
          <span className="sr-only">Open user menu</span>
          {session.user.image ? (
            <div className="h-10 w-10 rounded-full overflow-hidden relative">
              <Image 
                src={session.user.image}
                alt={session.user.name || "User avatar"}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white font-medium">
                {session.user.name?.charAt(0) || "U"}
              </span>
            </div>
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div 
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1}
        >
          <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            <p>Signed in as</p>
            <p className="font-medium truncate">{session.user.email ?? 'N/A'}</p>
          </div>

          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            tabIndex={-1}
            id="user-menu-item-0"
            onClick={() => setIsMenuOpen(false)}
          >
            Your Profile
          </Link>

          {session.user.role === 'admin' && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              tabIndex={-1}
              id="user-menu-item-1"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}

          {(session.user.role === 'venueOwner' || session.user.role === 'admin') && (
            <Link
              href="/listings/manage"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
              tabIndex={-1}
              id="user-menu-item-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Manage Listings
            </Link>
          )}

          <button
            onClick={() => {
              setIsMenuOpen(false);
              handleSignOut();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            tabIndex={-1}
            id="user-menu-item-3"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
