import { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'ref'> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface BadgeProps extends Omit<ComponentPropsWithoutRef<'div'>, 'ref'> {
  variant?: 'default' | 'outline' | 'secondary';
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'ref'> {
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  className?: string;
}

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'ref'> {
  className?: string;
}
