"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Command: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("border rounded-md bg-white", className)} {...props} />
);

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}
export const CommandInput: React.FC<CommandInputProps> = ({ className, onValueChange, onChange, ...props }) => (
  <div className="p-2 border-b">
    <input
      className={cn("w-full border-0 outline-none", className)}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      }}
      {...props}
    />
  </div>
);

export const CommandList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("max-h-60 overflow-auto", className)} {...props} />
);

export const CommandGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-1", className)} {...props} />
);

export const CommandEmpty: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn("p-3 text-sm text-gray-500", className)} {...props} />
);

export const CommandItem: React.FC<React.LiHTMLAttributes<HTMLLIElement>> = ({ className, ...props }) => (
  <li className={cn("flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 list-none", className)} {...props} />
);
