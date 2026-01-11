'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact-us', label: 'Contact Us' },
] as const;

export default function MobileMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-neo-border hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
        >
          <Menu size={20} aria-hidden="true" focusable="false" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 h-full w-64 border-l border-neo-border bg-background p-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:max-w-sm"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-semibold">
            Menu
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
              >
                <X size={20} aria-hidden="true" focusable="false" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="mt-4 flex flex-col gap-3">
            {navigationItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={handleLinkClick}
                className="body-md rounded-md px-2 py-1.5 hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
