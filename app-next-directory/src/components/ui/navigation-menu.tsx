"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavigationItemProps extends React.ComponentPropsWithoutRef<"a"> {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}

export function NavigationItem({
  href,
  active,
  children,
  className,
  ...props
}: NavigationItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "px-4 py-2",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
        active
          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
          : "text-muted-foreground hover:text-primary dark:text-gray-300 dark:hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export function NavigationMenu({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"nav">) {
  return (
    <nav
      className={cn(
        "flex items-center space-x-1",
        className
      )}
      {...props}
    >
      {children}
    </nav>
  );
}
