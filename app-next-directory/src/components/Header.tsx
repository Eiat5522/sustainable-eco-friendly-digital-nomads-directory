'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { AnimatePresence, motion } from 'framer-motion';
import { 
  BookOpen, 
  Calendar, 
  Home, 
  Leaf, 
  LogIn, 
  Mail, 
  Menu, 
  UserCircle, 
  UserPlus, 
  X, 
  Laptop,
  Search,
  Settings,
  User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ThemeToggle } from "./layout/ThemeToggle";
import Image from 'next/image';

const navigationItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Listings', href: '/listings', icon: Calendar },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Blog', href: '/blog', icon: BookOpen },
  { name: 'Contact', href: '/contact', icon: Mail },
];

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: Readonly<HeaderProps>) {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Handle scroll shadow/bg
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }, [pathname, mobileMenuOpen]);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // === extracted auth section ===
  let desktopAuthContent;
  if (status === 'loading') {
    desktopAuthContent = (
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  } else if (session) {
    desktopAuthContent = (
      <div className="relative group">
        <button
          className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-primary-500 hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:scale-105"
          aria-label="User menu"
        >
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User profile'}
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-100">
              {session.user?.name?.charAt(0)?.toUpperCase() || <UserCircle className="h-5 w-5" />}
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        <div
          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 transform scale-95 group-hover:scale-100 border border-gray-200 dark:border-gray-700"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {session.user?.name ?? 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.user?.email ?? ''}
            </p>
          </div>
          
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <User className="mr-3 h-4 w-4" />
            Dashboard
          </Link>
          
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="mr-3 h-4 w-4" />
            Settings
          </Link>
          
          <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
            <button
              onClick={() => signOut()}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogIn className="mr-3 h-4 w-4 rotate-180" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    desktopAuthContent = (
      <div className="flex items-center space-x-3">
        <button
          onClick={() => signIn()}
          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <LogIn className="mr-1.5 h-4 w-4" />
          Sign In
        </button>
        
        <Link
          href="/auth/signup"
          className="flex items-center text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          Sign Up
        </Link>
      </div>
    );
  }
  // === end extracted section ===

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-800/50' 
          : 'bg-transparent'
      } ${className}`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center group transition-transform hover:scale-105"
            >
              <div className="relative">
                <Leaf 
                  aria-hidden="true" 
                  className="text-primary-500 transition-transform group-hover:rotate-12 h-8 w-8" 
                />
                <Laptop 
                  aria-hidden="true" 
                  className="absolute -bottom-1 -right-2 text-gray-600 dark:text-gray-400 h-4 w-4" 
                />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Leaf & Laptop
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && (pathname?.startsWith(item.href + '/') ?? false));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center group text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    <Icon className={`mr-1.5 h-4 w-4 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-500"
                        layoutId="activeTab"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Auth Section - Desktop */}
            <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-700 pl-6">
              <ThemeToggle />
              {desktopAuthContent}
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            {status !== 'loading' && !session && (
              <>
                <button
                  onClick={() => signIn()}
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogIn className="h-5 w-5" />
                </button>
                <Link
                  href="/auth/signup"
                  className="p-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <UserPlus className="h-5 w-5" />
                </Link>
              </>
            )}
            {status !== 'loading' && session && (
              <div className="relative">
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User profile'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-100">
                      {session.user?.name?.charAt(0)?.toUpperCase() || <UserCircle className="h-5 w-5" />}
                    </div>
                  )}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleMobileMenuToggle}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && (pathname?.startsWith(item.href + '/') ?? false));
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href}
                    className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

              {session && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="px-3 py-2 mb-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {session.user?.name ?? 'User'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {session.user?.email ?? ''}
                    </p>
                  </div>
                  
                  <Link 
                    href="/dashboard"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <User className="mr-3 h-5 w-5" />
                    Dashboard
                  </Link>
                  
                  <Link 
                    href="/profile"
                    className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Link>
                  
                  <button
                    onClick={() => { signOut(); }}
                    className="flex items-center w-full px-3 py-2 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogIn className="mr-3 h-5 w-5 rotate-180" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
