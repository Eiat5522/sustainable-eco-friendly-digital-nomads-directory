'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Leaf, Map, Menu, Moon, Search, Sun, User, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MainNavProps {
  onSearchClick: () => void;
}

// Top-level navigation items
const navigationItems = [
  { name: 'Explore', href: '/listings', icon: Map },
  { name: 'Cities', href: '/cities', icon: Calendar },
  { name: 'Categories', href: '/categories', icon: User },
];

export function MainNav({ onSearchClick }: MainNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Leaf className="h-8 w-8 text-green-500 transition-transform group-hover:rotate-12" />
              <span className="ml-2 text-xl font-medium text-gray-900 dark:text-white">
                EcoNomads
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 flex items-center group ${
                    isActive ? 'text-green-600 dark:text-green-400' : ''
                  }`}
                >
                  <Icon className="mr-1 h-4 w-4" />
                  <span>{item.name}</span>
                  <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-green-600 dark:bg-green-400" />
                </Link>
              );
            })}

            {/* Search Button */}
            <button
              onClick={onSearchClick}
              className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full px-4 py-2 flex items-center transition-colors"
            >
              <Search className="h-4 w-4 mr-2" />
              <span>Search</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-white dark:bg-gray-900 shadow-lg rounded-b-lg"
            >
              <div className="px-4 pt-2 pb-3 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5 inline-block" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Mobile Search Button */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    /* TODO: Implement search dialog */
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Search className="mr-3 h-5 w-5" />
                  Search
                </button>

                {/* Mobile Theme Toggle */}
                <button
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-3 h-5 w-5" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-3 h-5 w-5" />
                      Dark Mode
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
