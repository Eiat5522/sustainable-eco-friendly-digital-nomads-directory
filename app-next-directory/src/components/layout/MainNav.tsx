sol foCar"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, Leaf, Map, Calendar, User, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

const navigationItems = [
  { name: 'Explore', href: '/listings', icon: Map },
  { name: 'Cities', href: '/cities', icon: Calendar },
  { name: 'Community', href: '/community', icon: User },
];

export function MainNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
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
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <Leaf className="h-8 w-8 text-primary-500 transition-transform group-hover:rotate-12" />
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
                  className={`text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center group ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : ''
                  }`}
                >
                  <Icon className="mr-1 h-4 w-4" />
                  <span>{item.name}</span>
                  <span className={`block h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              );
            })}

            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-700" />
              )}
            </button>

            <button className="ml-4 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/50 dark:hover:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full px-4 py-2 flex items-center transition-colors">
              <Search className="h-4 w-4 mr-2" />
              <span>Search</span>
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
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
            className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
                <button className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Search className="mr-3 h-5 w-5" />
                  Search
                </button>
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
