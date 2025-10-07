import { cn } from '@/lib/utils';
import * as React from 'react';

export interface SkipLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
}

const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, targetId = 'main-content', children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        className={cn(
          'sr-only focus:not-sr-only',
          'absolute left-0 top-0 z-50',
          'bg-primary text-primary-foreground',
          'px-4 py-2 text-sm font-medium',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transition-transform',
          className
        )}
        {...props}
      >
        {children || 'Skip to main content'}
      </a>
    );
  }
);
SkipLink.displayName = 'SkipLink';

export { SkipLink };
