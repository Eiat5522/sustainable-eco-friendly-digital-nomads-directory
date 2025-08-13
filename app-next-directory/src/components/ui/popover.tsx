"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover: React.FC<PopoverProps> = ({ open, onOpenChange, className, ...props }) => {
  return (
    <div className={cn("relative", className)} {...props} />
  );
};

import { Slot } from "@radix-ui/react-slot";

export const PopoverTrigger = ({ asChild, children, ...props }: any) => {
  if (asChild) {
    return <Slot {...props}>{children}</Slot>;
  }
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
};

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
}
export const PopoverContent: React.FC<PopoverContentProps> = ({ className, align, ...props }) => {
  return (
    <div
      data-align={align}
      className={cn(
        "z-50 w-72 rounded-md border bg-white p-2 shadow-md outline-none",
        className
      )}
      {...props}
    />
  );
};
