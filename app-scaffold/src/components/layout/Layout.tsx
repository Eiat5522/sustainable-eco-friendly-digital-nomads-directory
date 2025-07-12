"use client";

import { type ReactNode } from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <header className="bg-primary-500 border-b border-gray-200">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-white">
              Eco Digital Nomads
            </Link>
            <div className="flex gap-6">
              <Link href="/listings" className="text-white hover:text-primary-200">
                Listings
              </Link>
              <Link href="/about" className="text-white hover:text-primary-200">
                About
              </Link>
              <Link href="/contact" className="text-white hover:text-primary-200">
                Contact
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="min-h-screen bg-gray-100">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Eco Digital Nomads</h3>
              <p className="text-gray-600">
                Discover sustainable and eco-friendly spaces for digital nomads in Thailand.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/listings" className="text-gray-600 hover:text-primary-600">
                    Browse Listings
                  </Link>
                </li>
                <li>
                  <Link href="/submit" className="text-gray-600 hover:text-primary-600">
                    Submit a Listing
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-600 hover:text-primary-600">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/listings?category=coworking" className="text-gray-600 hover:text-primary-600">
                    Coworking Spaces
                  </Link>
                </li>
                <li>
                  <Link href="/listings?category=cafe" className="text-gray-600 hover:text-primary-600">
                    Eco Cafes
                  </Link>
                </li>
                <li>
                  <Link href="/listings?category=accommodation" className="text-gray-600 hover:text-primary-600">
                    Sustainable Accommodation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Eco Digital Nomads. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
