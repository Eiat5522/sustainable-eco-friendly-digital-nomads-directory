"use client";

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { DoorOpen, Heart, Menu, User, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function Header() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const displayName = session?.user?.name ?? session?.user?.email ?? 'your account'
  const shortName = session?.user?.name?.split(' ')[0] ?? session?.user?.name ?? ''
  const accountLabel = isAuthenticated ? `Signed in as ${displayName}` : 'Sign in'
  const [signingOut, setSigningOut] = useState(false)
  const userImage = typeof session?.user?.image === 'string' ? session.user.image : null
  const accountInitials = (() => {
    const source = session?.user?.name ?? session?.user?.email ?? ''
    if (!source) return 'U'
    return source
      .split(' ')
      .map((part) => part.trim().charAt(0).toUpperCase())
      .join('')
      .slice(0, 2)
  })()

  const handleSignOut = useCallback(async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut({ redirectTo: '/' })
    } catch (error) {
      console.error('[auth] sign out failed', error)
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/signout?callbackUrl=/'
      }
    } finally {
      setSigningOut(false)
    }
  }, [])

  return (
    <header className="w-full bg-background border-b-4 border-neo-border">
      <div className="container mx-auto px-4 py-4">
        <div className="relative flex items-center justify-between">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-3">
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
            <Link href="/">
              <span className="body-md hover:text-neo-primary font-semibold transition-colors">Home</span>
            </Link>
            <Link href="/search">
              <span className="body-md hover:text-neo-primary font-semibold transition-colors">Search</span>
            </Link>
            <Link href="/blog">
              <span className="body-md hover:text-neo-primary font-semibold transition-colors">Blog</span>
            </Link>
            <Link href="/contact-us">
              <span className="body-md hover:text-neo-primary font-semibold transition-colors">Contact Us</span>
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
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border-2 border-neo-border bg-neo-surface px-2 py-1 pr-3 text-sm font-semibold text-neo-text-primary transition hover:border-neo-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
                      aria-label="Open account menu"
                      aria-haspopup="menu"
                    >
                      <span className="relative inline-flex h-9 w-9 overflow-hidden rounded-full bg-neo-secondary/40">
                        {userImage ? (
                          <Image
                            src={userImage}
                            alt={`${displayName} avatar`}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs uppercase text-neo-text-primary">
                            {accountInitials}
                          </span>
                        )}
                      </span>
                      <span className="hidden sm:inline text-xs text-neo-text-secondary">Account</span>
                      <ChevronDown className="h-4 w-4 text-neo-text-secondary" aria-hidden="true" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={12}
                    className="z-50 min-w-[220px] rounded-xl border border-neo-border bg-white/95 p-2 shadow-lg backdrop-blur"
                  >
                    <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neo-text-secondary">
                      {accountLabel}
                    </DropdownMenu.Label>
                    <DropdownMenu.Separator className="my-2 h-px bg-neo-border/60" />
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neo-text-primary outline-none transition data-[highlighted]:bg-neo-primary/10"
                      >
                        <User size={16} aria-hidden="true" />
                        My profile
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/profile#favorites"
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neo-text-primary outline-none transition data-[highlighted]:bg-neo-primary/10"
                      >
                        <Heart size={16} aria-hidden="true" />
                        Favorite listings
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-2 h-px bg-neo-border/60" />
                    <DropdownMenu.Item
                      disabled={signingOut}
                      onSelect={(event) => {
                        event.preventDefault()
                        if (!signingOut) {
                          void handleSignOut()
                        }
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-neo-text-primary outline-none transition data-[highlighted]:bg-rose-100 data-[highlighted]:text-rose-700 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
                    >
                      <DoorOpen size={16} aria-hidden="true" />
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              ) : (

                <Link href="/auth" aria-label="Sign in">
                  <span
                    className="w-10 h-10 bg-neo-surface neo-card rounded-full flex items-center justify-center text-neo-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
                    title="Sign in"
                    aria-hidden="true"
                  >
                    <span className="sr-only">Sign in</span>
                    <User size={20} aria-hidden="true" focusable="false" />
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
