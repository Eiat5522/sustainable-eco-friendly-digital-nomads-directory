"use client";

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoBadge } from '@/components/ui/neo-badge'
import { User, Menu } from 'lucide-react'

export function Header() {
  const { data: session, status } = useSession()

  const authLink = session ? '/auth/login' : '/auth/signup'

  return (
    <header className="w-full bg-background border-b-4 border-neo-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Product Hunt Badge */}
          <div className="flex items-center space-x-4">
            <NeoBadge variant="secondary" className="hidden md:flex">
              <span className="text-xs font-bold">🏆 #1 Product of the Day</span>
            </NeoBadge>
          </div>

          {/* Navigation */}
          {/* Mobile menu trigger (scaffold) */}
          <button
            type="button"
            aria-label="Open menu"
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
          >
            <Menu size={20} />
            <span className="sr-only">Open menu</span>
          </button>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/about" className="body-md hover:text-neo-primary font-semibold transition-colors">
              About us
            </Link>
            <Link href="/contact-us" className="body-md hover:text-neo-primary font-semibold transition-colors">
              Contact us
            </Link>
            <div className="w-8 h-8 bg-neo-primary rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <Link href="/blog" className="body-md hover:text-neo-primary font-semibold transition-colors">
              Blog
            </Link>
            <Link href="/search" className="body-md hover:text-neo-primary font-semibold transition-colors">
              Search
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <NeoButton asChild variant="outline" size="md">
              <Link href="/listings/new">Add Your Listing</Link>
            </NeoButton>
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
