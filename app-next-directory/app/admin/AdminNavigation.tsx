'use client';

import { ArrowUpRight, LayoutDashboard, ListChecks, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    description: 'Overview and status',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/users',
    label: 'Users',
    description: 'Roles and access',
    icon: Users,
  },
  {
    href: '/admin/listings',
    label: 'Listings',
    description: 'Approvals and updates',
    icon: ListChecks,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    description: 'Workspace preferences',
    icon: Settings,
  },
];

const UTILITY_ITEMS = [
  {
    href: '/',
    label: 'Back to Site',
    description: 'Public directory',
    icon: ArrowUpRight,
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export default function AdminNavigation(): React.JSX.Element {
  const pathname = usePathname() ?? '';

  return (
    <aside className="space-y-4" aria-label="Admin navigation">
      <div className="rounded-2xl border-2 border-neo-border bg-white/90 p-4 shadow-[6px_6px_0px_0px] shadow-neo-shadow">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neo-text-secondary">
          Admin Workspace
        </p>
        <nav className="mt-4 flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map(item => {
            const isActive = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex min-w-[200px] items-center gap-3 rounded-xl border-2 border-neo-border bg-neo-surface px-4 py-3 text-sm font-semibold text-neo-text-primary shadow-[4px_4px_0px_0px] shadow-neo-shadow transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px]',
                  isActive &&
                    'bg-neo-primary text-white shadow-[2px_2px_0px_0px] hover:bg-neo-primary/90'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border-2 border-neo-border bg-white text-neo-text-primary transition-colors',
                    isActive && 'bg-white text-neo-primary'
                  )}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      'text-xs font-medium text-neo-text-secondary',
                      isActive && 'text-white/80'
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t-2 border-dashed border-neo-border/40 pt-4">
          {UTILITY_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="group flex items-center gap-3 rounded-xl border-2 border-neo-border bg-neo-secondary/20 px-4 py-3 text-sm font-semibold text-neo-text-primary shadow-[4px_4px_0px_0px] shadow-neo-shadow transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-neo-secondary/30 hover:shadow-[2px_2px_0px_0px]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-neo-border bg-white text-neo-text-primary">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-xs font-medium text-neo-text-secondary">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
