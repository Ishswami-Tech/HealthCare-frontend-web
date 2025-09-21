import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Optimized Button component for 100K users

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:scale-105 active:scale-95",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 hover:scale-105 active:scale-95",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 hover:scale-105 active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:scale-105 active:scale-95",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 hover:scale-105 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        // Medical-specific variants
        medical:
          "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:ring-emerald-500/30",
        "medical-outline":
          "border-2 border-emerald-600 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20 dark:border-emerald-400 dark:text-emerald-400 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md",
        emergency:
          "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg animate-pulse hover:animate-none transform hover:scale-105 active:scale-95 ring-2 ring-red-200 dark:ring-red-800 focus-visible:ring-red-500/30",
        consultation:
          "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:ring-blue-500/30",
        ayurveda:
          "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:ring-orange-500/30",
        wellness:
          "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:ring-green-500/30",
        premium:
          "bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:ring-purple-500/30",
        magnetic:
          "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-xl transform hover:scale-110 hover:-translate-y-1 active:scale-95 transition-all duration-300 focus-visible:ring-emerald-500/30",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 text-base",
        xl: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-lg font-semibold",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "mobile-friendly": "h-12 px-6 py-3 text-base min-w-[120px] sm:h-10 sm:px-4 sm:py-2 sm:text-sm sm:min-w-0",
      },
      glow: {
        none: "",
        subtle: "shadow-glow-subtle",
        medium: "shadow-glow-medium animate-glow",
        strong: "shadow-glow-strong animate-glow-strong",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

const Button = React.memo(React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: string
  }
>(function Button(
  {
    className,
    variant,
    size,
    glow,
    asChild = false,
    loading = false,
    loadingText,
    children,
    disabled,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot : "button"

  // Memoize className computation for performance
  const computedClassName = React.useMemo(
    () => cn(buttonVariants({ variant, size, glow, className })),
    [variant, size, glow, className]
  )

  return (
    <Comp
      ref={ref}
      data-slot="button"
      className={computedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading ? loadingText || "Loading..." : children}
    </Comp>
  )
}))

export { Button, buttonVariants }
