import { cva } from "class-variance-authority"

export const inputVariants = cva(
  "flex w-full rounded-lg border border-input bg-background text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        filled: "bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-input",
        underline: "border-0 border-b-2 border-b-input rounded-none bg-transparent focus-visible:border-b-ring",
        ghost: "border-transparent bg-transparent focus-visible:bg-muted/50 focus-visible:border-input",
      },
      size: {
        sm: "h-8 px-3 py-1 text-sm",
        md: "h-10 px-3 py-2",
        lg: "h-12 px-4 py-3 text-lg",
      },
      state: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive/20",
        success: "border-success-500 focus-visible:ring-success-500/20",
        warning: "border-warning-500 focus-visible:ring-warning-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
    },
  }
)
