import Link from 'next/link';
import React from 'react';

export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          Sustainable Nomads
        </Link>
        <nav className="space-x-4">
          <Link href="/listings" className="hover:underline">
            Listings
          </Link>
          <Link href="/blog" className="hover:underline">
            Blog
          </Link>
          <Link href="/about" className="hover:underline">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
