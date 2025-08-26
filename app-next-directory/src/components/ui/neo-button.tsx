import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface NeoButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "primary" | "secondary" | "accent" | "success" | "outline"
  size?: "sm" | "md" | "lg"
}

const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const baseClasses = "neo-button neo-button-hover inline-flex items-center justify-center whitespace-nowrap rounded-lg font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      primary: "bg-neo-primary text-white hover:bg-neo-primary/90",
      secondary: "bg-neo-secondary text-neo-text-primary hover:bg-neo-secondary/90",
      accent: "bg-neo-accent text-white hover:bg-neo-accent/90",
      success: "bg-neo-success text-white hover:bg-neo-success/90",
      outline: "bg-transparent text-neo-text-primary hover:bg-neo-text-primary hover:text-neo-surface"
    }
    
    const sizes = {
      sm: "h-10 px-4 py-2 text-sm",
      md: "h-12 px-6 py-3 text-base",
      lg: "h-14 px-8 py-4 text-lg"
    }

    return (
      <Comp
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
NeoButton.displayName = "NeoButton"

export { NeoButton }