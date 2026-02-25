/**
 * Header Auth Client Component
 *
 * Client-side interactive component for the header authentication UI.
 * Receives pre-fetched auth state from the server component and handles
 * all interactive behaviors (dropdown menu, sign out, etc.)
 */

'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, DoorOpen, LayoutDashboard, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useCallback, useState } from 'react';
import type { AuthUser, UserDisplayInfo } from '@/lib/data-access/auth.dal';
import structuredLogger from '@/lib/logger';

interface HeaderAuthClientProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
  displayInfo: UserDisplayInfo | null;
  className?: string;
}

export function HeaderAuthClient({
  isAuthenticated,
  isAdmin,
  user,
  displayInfo,
  className,
}: HeaderAuthClientProps) {
  const [signingOut, setSigningOut] = useState(false);
  const userImage = user?.image ?? null;

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({ redirectTo: '/' });
    } catch (error) {
      setSigningOut(false);
      structuredLogger.error('Sign out failed:', error);
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/signout?callbackUrl=/';
      }
    }
  }, [signingOut]);

  const accountLabel = isAuthenticated
    ? `Signed in as ${displayInfo?.displayName ?? 'User'}`
    : 'Sign in';

  return (
    <div className={`flex items-center space-x-4 ${className ?? ''}`}>
      {isAuthenticated && (
        <span className="hidden md:inline-flex items-center gap-2 rounded-full border-2 border-neo-border bg-neo-success/20 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-neo-text-primary shadow-[3px_3px_0_0] shadow-neo-shadow">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
          {displayInfo?.shortName ? `Welcome, ${displayInfo.shortName}!` : 'Signed in'}
        </span>
      )}

      {isAuthenticated ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border-2 border-neo-border bg-neo-surface px-2 py-1 pr-3 text-sm font-semibold text-neo-text-primary shadow-[4px_4px_0_0] shadow-neo-shadow transition-all duration-200 hover:-translate-y-0.5 hover:border-neo-primary hover:bg-neo-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
              aria-label="Open account menu"
              aria-haspopup="menu"
            >
              <span className="relative inline-flex h-9 w-9 overflow-hidden rounded-full bg-neo-secondary/40">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={`${displayInfo?.displayName ?? 'User'} avatar`}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs uppercase text-neo-text-primary">
                    {displayInfo?.initials ?? '??'}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline heading-display text-[11px] uppercase tracking-[0.1em] text-neo-text-secondary">
                Account
              </span>
              <ChevronDown className="h-4 w-4 text-neo-text-secondary" aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="end"
            sideOffset={12}
            className="z-50 min-w-[220px] rounded-2xl border-2 border-neo-border bg-neo-surface/95 p-2 shadow-[8px_8px_0_0] shadow-neo-shadow backdrop-blur"
          >
            <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neo-text-secondary">
              {accountLabel}
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="my-2 h-px bg-neo-border/60" />
            <DropdownMenu.Item asChild>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neo-text-primary outline-none transition-all duration-150 data-[highlighted]:bg-neo-primary/10 data-[highlighted]:translate-x-0.5"
              >
                <User size={16} aria-hidden="true" />
                My profile
              </Link>
            </DropdownMenu.Item>
            {isAdmin && (
              <DropdownMenu.Item asChild>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neo-text-primary outline-none transition-all duration-150 data-[highlighted]:bg-neo-primary/10 data-[highlighted]:translate-x-0.5"
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
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-neo-text-primary outline-none transition-all duration-150 data-[highlighted]:bg-rose-100 data-[highlighted]:text-rose-700 data-[highlighted]:translate-x-0.5 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-neo-border bg-neo-surface text-neo-text-primary shadow-[4px_4px_0_0] shadow-neo-shadow transition-colors hover:bg-neo-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
        >
          <User size={20} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
