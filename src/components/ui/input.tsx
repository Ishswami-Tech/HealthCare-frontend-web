import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 border bg-transparent text-base shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border-input dark:bg-input/30 rounded-md px-3 py-1 h-9",
        medical: "form-medical border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl px-4 py-3 h-12 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
        floating: "form-floating border-border/50 dark:border-border/60 rounded-xl px-3 pt-6 pb-2 h-auto focus-visible:border-primary",
        mobile: "mobile-touch-target rounded-xl px-4 py-4 h-12 text-base border-border/50 dark:border-border/60",
      },
      inputSize: {
        sm: "h-8 px-2 py-1 text-sm",
        default: "h-9 px-3 py-1",
        lg: "h-10 px-4 py-2",
        xl: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {
  variant?: "default" | "medical" | "floating" | "mobile"
  inputSize?: "sm" | "default" | "lg" | "xl"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
