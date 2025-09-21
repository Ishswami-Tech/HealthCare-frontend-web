import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content w-full border bg-transparent text-base shadow-xs transition-all duration-300 outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
  {
    variants: {
      variant: {
        default: "border-input dark:bg-input/30 rounded-md px-3 py-2 min-h-16",
        medical: "form-medical border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl px-4 py-3 min-h-20 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
        floating: "form-floating border-border/50 dark:border-border/60 rounded-xl px-3 pt-6 pb-2 min-h-20 focus-visible:border-primary",
        mobile: "mobile-touch-target rounded-xl px-4 py-4 min-h-24 text-base border-border/50 dark:border-border/60",
      },
      textareaSize: {
        sm: "min-h-12 px-2 py-1 text-sm",
        default: "min-h-16 px-3 py-2",
        lg: "min-h-20 px-4 py-3",
        xl: "min-h-24 px-4 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
)

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {
  variant?: "default" | "medical" | "floating" | "mobile"
  textareaSize?: "sm" | "default" | "lg" | "xl"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(textareaVariants({ variant, textareaSize }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
