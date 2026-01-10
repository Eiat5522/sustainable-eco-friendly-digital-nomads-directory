'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MobileMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  useEffect(() => {
   const handleEscape = (e: KeyboardEvent) => {
     if (e.key === 'Escape' && open) {
       setOpen(false);
     }
   };
   
   document.addEventListener('keydown', handleEscape);

    // Prevent background scroll when menu is open
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-neo-border hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
      >
        <Menu size={20} aria-hidden="true" focusable="false" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          className="fixed inset-0 z-50 flex"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="relative ml-auto w-64 max-w-full bg-background p-4 border-l border-neo-border shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary"
              >
                <X size={20} aria-hidden="true" focusable="false" />
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-3">
              <Link href="/" onClick={handleLinkClick}>
                <span className="body-md">Home</span>
              </Link>
              <Link href="/search" onClick={handleLinkClick}>
                <span className="body-md">Search</span>
              </Link>
              <Link href="/blog" onClick={handleLinkClick}>
                <span className="body-md">Blog</span>
              </Link>
              <Link href="/contact-us" onClick={handleLinkClick}>
                <span className="body-md">Contact Us</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
