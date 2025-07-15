'use client';

import { signIn, signOut, useSession } from '@auth/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import Logo from '../common/Logo';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center mr-8">
            <Logo />
            <span className="font-bold text-xl ml-2 text-gray-800 dark:text-white">Leaf & Laptop</span>
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link
              href="/"
              className={`text-base font-medium ${isActive('/') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'}`}
            >
              Home
            </Link>
            <Link
              href="/explore"
              className={`text-base font-medium ${isActive('/explore') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'}`}
            >
              Explore
            </Link>
            <Link
              href="/cities"
              className={`text-base font-medium ${isActive('/cities') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'}`}
            >
              Cities
            </Link>
            <Link
              href="/blog"
              className={`text-base font-medium ${isActive('/blog') ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400'}`}
            >
              Blog
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* Auth Button */}
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          ) : session ? (
            <div className="relative group">
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="User menu"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-100">
                    {session.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{session.user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Dashboard
                </Link>
                <Link
                  href="/account"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Account Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="p-1.5 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Sign in"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            aria-label="Open menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/listings"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Listings
          </Link>
          <Link
            href="/city/chiang-mai"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Chiang Mai
          </Link>
          <Link
            href="/city/bangkok"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Bangkok
          </Link>
          <Link
            href="/listings/sample-eco-friendly-listing"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Sample Listing
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
