import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps, BadgeProps, SelectProps } from '@/types/ui';

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary-600 text-white hover:bg-primary-700': variant === 'default',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'text-primary underline-offset-4 hover:underline': variant === 'link',
        },
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-primary-100 text-primary-800': variant === 'default',
          'border border-gray-200': variant === 'outline',
          'bg-gray-100 text-gray-800': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  options,
  onValueChange,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        'block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10',
        'text-base focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm',
        className
      )}
      onChange={(e) => onValueChange(e.target.value)}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
