"use client";

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { User, Menu } from 'lucide-react'
import Image from 'next/image'

export function Header() {
  const { data: session, status } = useSession()

  const authLink = session ? '/auth/login' : '/auth/signup'

  return (
    <header className="w-full bg-background border-b-4 border-neo-border">
      <div className="container mx-auto px-4 py-4">
        <div className="relative flex items-center justify-between">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center" aria-label="Go to homepage">
              <Image
                src="/leaf-laptop-logo.png"
                alt="Sustainable Nomads"
                width={36}
                height={36}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            {/* Mobile menu trigger (scaffold) */}
            <button
              type="button"
              aria-label="Open menu"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
            >
              <Menu size={20} />
              <span className="sr-only">Open menu</span>
            </button>
          </div>

          {/* Center: Navigation (desktop) */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="body-md hover:text-neo-primary font-semibold transition-colors">
              Home
            </Link>
            <Link href="/search" className="body-md hover:text-neo-primary font-semibold transition-colors">
              Search
            </Link>
            <Link href="/blog" className="body-md hover:text-neo-primary font-semibold transition-colors">
              Blog
            </Link>
            <Link href="/contact-us" className="body-md hover:text-neo-primary font-semibold transition-colors">
              Contact Us
            </Link>
          </nav>

          {/* Right: CTA/User */}
          <div className="flex items-center space-x-4">
            {status !== 'loading' && (
              <Link
                href={authLink}
                className="w-10 h-10 bg-neo-surface neo-card rounded-full flex items-center justify-center"
              >
                <User size={20} className="text-neo-text-primary" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
