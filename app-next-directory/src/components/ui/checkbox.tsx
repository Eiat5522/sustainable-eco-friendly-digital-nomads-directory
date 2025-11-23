import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'h-4 w-4 rounded border border-neo-border/60 text-neo-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neo-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onChange={event => {
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';
