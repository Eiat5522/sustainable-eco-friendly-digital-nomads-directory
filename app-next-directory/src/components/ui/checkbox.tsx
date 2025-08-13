"use client";

import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, onChange, onCheckedChange, checked, defaultChecked, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      ref={ref}
      className={"h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 " + (className || "")}
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={(e) => {
        onChange?.(e);
        onCheckedChange?.(e.target.checked);
      }}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";
