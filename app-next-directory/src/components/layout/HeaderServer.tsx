/**
 * Header Server Component
 *
 * Server component version of the header that delegates auth UI
 * to a Suspense-wrapped UserAuthStatus component for PPR optimization.
 *
 * Key features:
 * - Static navigation renders immediately
 * - Auth state loads asynchronously via UserAuthStatus
 * - Protects static shell during partial prerendering
 */

import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import MobileMenu from './MobileMenu';
import UserAuthStatus from './UserAuthStatus';

const navLinkClass =
  'body-md heading-display text-sm font-black uppercase tracking-[0.14em] text-neo-text-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary rounded-md px-3 py-1.5 hover:bg-neo-primary/10 hover:text-neo-primary hover:-translate-y-0.5 active:translate-y-0 relative after:absolute after:left-2 after:right-2 after:-bottom-0.5 after:h-0.5 after:scale-x-0 after:bg-neo-primary after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:after:scale-x-100';

export function HeaderServer(): React.JSX.Element {
  return (
    <header className="relative z-40 w-full border-b-4 border-neo-border bg-gradient-to-r from-neo-surface via-neo-surface to-neo-secondary/15 backdrop-blur supports-[backdrop-filter]:bg-neo-surface/95">
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-3 justify-self-start">
            <Link href="/" aria-label="Go to homepage">
              <span
                className="inline-flex items-center rounded-full border-2 border-neo-border bg-neo-surface px-2 py-1 shadow-[4px_4px_0_0] shadow-neo-shadow"
                aria-hidden="true"
              >
                <Image
                  src="/leaf-laptop-logo.png"
                  alt="Sustainable Nomads"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                  priority
                />
              </span>
            </Link>
            {/* Mobile menu (client) */}
            <MobileMenu />
          </div>

          {/* Center: Navigation (desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2 rounded-full border-2 border-neo-border bg-neo-surface/90 px-3 py-1.5 shadow-[6px_6px_0_0] shadow-neo-shadow"
          >
            <Link href="/" className={navLinkClass}>
              Home
            </Link>
            <Link href="/search" className={navLinkClass}>
              Search
            </Link>
            <Link href="/categories" className={navLinkClass}>
              Categories
            </Link>
            <Link href="/blog" className={navLinkClass}>
              Blog
            </Link>
            <Link href="/contact-us" className={navLinkClass}>
              Contact Us
            </Link>
          </nav>

          {/* Right: Auth Status */}
          <div className="hidden md:flex items-center col-start-3 justify-self-end">
            <Suspense
              fallback={
                <div className="h-10 w-28 animate-pulse rounded-full border-2 border-neo-border bg-neo-surface/80" />
              }
            >
              <UserAuthStatus />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
