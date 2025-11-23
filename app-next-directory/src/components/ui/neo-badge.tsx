import * as React from 'react';
import { cn } from '@/lib/utils';

export interface NeoBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'accent' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const NeoBadge = React.forwardRef<HTMLDivElement, NeoBadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center rounded-full border-2 border-neo-border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

    const variants = {
      default: 'bg-neo-primary text-white',
      secondary: 'bg-neo-secondary text-neo-text-primary',
      accent: 'bg-neo-accent text-white',
      success: 'bg-neo-success text-white',
      outline: 'bg-transparent text-neo-text-primary',
    };

    const sizes = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
NeoBadge.displayName = 'NeoBadge';

export { NeoBadge };
