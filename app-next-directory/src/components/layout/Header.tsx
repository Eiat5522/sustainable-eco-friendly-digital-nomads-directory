'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, DoorOpen, LayoutDashboard, Menu, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Session } from 'next-auth';
import { SessionContext, signOut } from 'next-auth/react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useCachedUserProfile } from '@/hooks/useCachedUserProfile';
import { structuredLogger } from '@/lib/logger';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

function useSafeSession(): { session: Session | null; status: SessionStatus } {
  const context = useContext(SessionContext);
  const hasLoggedMissingProviderRef = useRef(false);

  useEffect(() => {
    if (!context && process.env.NODE_ENV !== 'production' && !hasLoggedMissingProviderRef.current) {
      hasLoggedMissingProviderRef.current = true;
      structuredLogger.warn(
        '[auth] Header rendered without SessionProvider; defaulting to unauthenticated state',
        { component: 'auth' }
      );
    }
  }, [context]);

  if (!context) {
    return { session: null, status: 'unauthenticated' };
  }

  return { session: context.data ?? null, status: context.status as SessionStatus };
}

export function Header(): React.JSX.Element {
  const { session, status } = useSafeSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = ['admin', 'superAdmin'].includes(session?.user?.role ?? '');
  const { displayInfo } = useCachedUserProfile(
    session?.user ?? null,
    isAuthenticated,
    'your account'
  );
  const displayName = displayInfo.displayName;
  const shortName = displayInfo.shortName;
  const accountLabel = isAuthenticated ? `Signed in as ${displayName}` : 'Sign in';
  const [signingOut, setSigningOut] = useState(false);
  const userImage = typeof session?.user?.image === 'string' ? session.user.image : null;
  const accountInitials = displayInfo.initials;

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({ redirectTo: '/' });
    } catch (_error) {
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/signout?callbackUrl=/';
      }
    } finally {
      setSigningOut(false);
    }
  }, [signingOut]);

  return (
    <header className="w-full bg-background border-b-4 border-neo-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
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
              aria-label="Open navigation menu"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-neo-border hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
            >
              <Menu size={20} aria-hidden="true" focusable="false" />
            </button>
          </div>

          {/* Center: Navigation (desktop) */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="body-md hover:text-neo-primary font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary rounded-sm px-1 py-1"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="body-md hover:text-neo-primary font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary rounded-sm px-1 py-1"
            >
              Search
            </Link>
            <Link
              href="/blog"
              className="body-md hover:text-neo-primary font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary rounded-sm px-1 py-1"
            >
              Blog
            </Link>
            <Link
              href="/contact-us"
              className="body-md hover:text-neo-primary font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary rounded-sm px-1 py-1"
            >
              Contact Us
            </Link>
          </nav>

          {/* Right: CTA/User */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <span className="hidden md:inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                <span
                  className="inline-flex h-2 w-2 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                {shortName ? `Welcome, ${shortName}!` : 'Signed in'}
              </span>
            )}
            {status !== 'loading' &&
              (isAuthenticated ? (
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
                      <span className="hidden sm:inline text-xs text-neo-text-secondary">
                        Account
                      </span>
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
                    {isAdmin && (
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neo-text-primary outline-none transition data-[highlighted]:bg-neo-primary/10"
                        >
                          <LayoutDashboard size={16} aria-hidden="true" />
                          Admin dashboards
                        </Link>
                      </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Separator className="my-2 h-px bg-neo-border/60" />
                    <DropdownMenu.Item
                      disabled={signingOut}
                      onSelect={event => {
                        event.preventDefault();
                        if (!signingOut) {
                          void handleSignOut();
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
                <Link
                  href="/auth/login"
                  aria-label="Sign in to your account"
                  className="inline-flex w-10 h-10 bg-neo-surface neo-card rounded-full items-center justify-center text-neo-text-primary hover:bg-neo-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary transition-colors"
                >
                  <User size={20} aria-hidden="true" />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
