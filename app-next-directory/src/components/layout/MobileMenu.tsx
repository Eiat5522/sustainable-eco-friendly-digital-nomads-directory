'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

export default function MobileMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Restore focus to trigger when closing
  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [open]);

  // Manage focus trap, initial focus, escape key, and scroll locking
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return undefined;
    }

    const focusable = () => getFocusableElements(panelRef.current);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === 'Tab') {
        const elements = focusable();
        if (elements.length === 0) return;

        const first = elements[0];
        const last = elements[elements.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (active === first || !panelRef.current?.contains(active)) {
            last.focus();
            event.preventDefault();
          }
        } else if (active === last || !panelRef.current?.contains(active)) {
          first.focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Initial focus: close button if available, else first focusable
    const elements = focusable();
    const target = closeButtonRef.current ?? elements[0];
    target?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type='button'
        aria-label='Open navigation menu'
        onClick={() => setOpen(true)}
        className='md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-neo-border hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary'
      >
        <Menu size={20} aria-hidden='true' focusable='false' />
      </button>

      {open && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Mobile navigation menu'
          className='fixed inset-0 z-50 flex'
        >
          <div className='absolute inset-0 bg-black/40' onClick={() => setOpen(false)} />

          <div
            ref={panelRef}
            className='relative ml-auto w-64 max-w-full bg-background p-4 border-l border-neo-border shadow-lg'
          >
            <div className='flex items-center justify-between'>
              <span className='font-semibold'>Menu</span>
              <button
                ref={closeButtonRef}
                type='button'
                aria-label='Close navigation menu'
                onClick={() => setOpen(false)}
                className='inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-neo-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary'
              >
                <X size={20} aria-hidden='true' focusable='false' />
              </button>
            </div>

            <nav className='mt-4 flex flex-col gap-3'>
              <Link href='/' onClick={handleLinkClick}>
                <span className='body-md'>Home</span>
              </Link>
              <Link href='/search' onClick={handleLinkClick}>
                <span className='body-md'>Search</span>
              </Link>
              <Link href='/blog' onClick={handleLinkClick}>
                <span className='body-md'>Blog</span>
              </Link>
              <Link href='/contact-us' onClick={handleLinkClick}>
                <span className='body-md'>Contact Us</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
