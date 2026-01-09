/**
 * Page Layout Server Component
 *
 * Server-rendered page layout that uses server components for Header and Footer.
 * Auth UI and interactive elements are isolated as client islands with Suspense.
 *
 * Key features:
 * - Static layout shell renders immediately
 * - Auth state loads asynchronously via UserAuthStatus
 * - Newsletter form is a client island in Footer
 * - Optimized for partial prerendering (PPR)
 */

import type React from 'react';
import { FooterServer } from '@/components/layout/FooterServer';
import { HeaderServer } from '@/components/layout/HeaderServer';
import { SkipLink } from '@/components/ui/skip-link';
import { cn } from '@/lib/utils';

interface PageLayoutServerProps {
  /** Content to render in the main section */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the root container */
  className?: string;
  /** Whether to display the newsletter signup form in the footer */
  showFooterNewsletter?: boolean;
}

/**
 * Server-rendered page layout with accessibility features
 * - Skip links for keyboard navigation
 * - Proper semantic landmarks
 * - Consistent navigation structure
 * - Header auth UI loads via Suspense (PPR)
 */
export function PageLayoutServer({
  children,
  className = '',
  showFooterNewsletter = true,
}: PageLayoutServerProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Skip Links - Styled to blend with white header, visible only on focus */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>

      {/* Server-rendered Header with Suspense-wrapped auth */}
      <HeaderServer />

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Server-rendered Footer with client newsletter form */}
      <FooterServer showNewsletter={showFooterNewsletter} />
    </div>
  );
}
