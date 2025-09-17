"use client";

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { User, Menu } from 'lucide-react'
import Image from 'next/image'

export function Header() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const displayName = session?.user?.name ?? session?.user?.email ?? 'your account'
  const shortName = session?.user?.name?.split(' ')[0] ?? session?.user?.name ?? ''
  const accountLabel = isAuthenticated ? `Signed in as ${displayName}` : 'Sign in'

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
                className="h-9 w-9 object-contain"
                priority
              />
            </Link>
            {/* Mobile menu trigger (scaffold) */}
            <button
              type="button"
              aria-label="Open menu"
              aria-controls="mobile-nav"
              aria-expanded="false"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
            >
              <Menu size={20} aria-hidden="true" focusable="false" />
            </button>
          </div>

          {/* Center: Navigation (desktop) */}
          <nav aria-label="Primary" className="hidden md:flex items-center space-x-8 absolute left-1/2 -translate-x-1/2">
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
            {isAuthenticated && (
              <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                {shortName ? `Welcome, ${shortName}!` : 'Signed in'}
              </span>
            )}
            {status !== 'loading' && (
              isAuthenticated ? (
                <div
                  className="relative w-10 h-10 bg-neo-surface neo-card rounded-full flex items-center justify-center opacity-60 cursor-not-allowed"
                  aria-disabled="true"
                  role="status"
                  aria-label={accountLabel}
                  title={accountLabel}
                >
                  <span className="sr-only">{accountLabel}</span>
                  <User size={20} className="text-neo-text-secondary" aria-hidden="true" focusable="false" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white" aria-hidden="true">
                    ✓
                  </span>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  aria-label="Sign in"
                  className="w-10 h-10 bg-neo-surface neo-card rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
                >
                  <span className="sr-only">Sign in</span>
                  <User size={20} className="text-neo-text-primary" aria-hidden="true" focusable="false" />
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
