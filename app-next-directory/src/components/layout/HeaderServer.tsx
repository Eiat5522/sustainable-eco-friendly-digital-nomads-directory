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

const navLinkClass = "body-md hover:text-neo-primary font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary rounded-sm px-1 py-1";

export function HeaderServer(): React.JSX.Element {
  return (
    <header className="w-full bg-background border-b-4 border-neo-border">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-3 justify-self-start">
            <Link href="/" aria-label="Go to homepage">
              <span className="inline-flex items-center" aria-hidden="true">
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
          <nav className="hidden md:flex items-center gap-6 justify-self-center">
              <Link
                href="/"
                className={navLinkClass}
              >
                Home
              </Link>
              <Link
                href="/search"
                className={navLinkClass}
              >
                Search
              </Link>
              <Link
                href="/blog"
                className={navLinkClass}
              >
                Blog
              </Link>
              <Link
                href="/contact-us"
                className={navLinkClass}
              >
                Contact Us
              </Link>
            </nav>
 
           {/* Right: Auth Status */}
           <div className="hidden md:flex items-center justify-self-end">
             <Suspense fallback={
               <div className="h-10 w-24 animate-pulse bg-gray-200 rounded" role="status">
                 <span className="sr-only">Loading authentication status</span>
               </div>
             }>
               <UserAuthStatus />
             </Suspense>
           </div>            
          </div>
        </div>
    </header>
  );
}
