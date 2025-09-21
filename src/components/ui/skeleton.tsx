import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md",
  {
    variants: {
      variant: {
        default: "bg-accent",
        medical: "bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-800/10",
        shimmer: "bg-gradient-to-r from-muted via-muted-foreground/20 to-muted bg-[length:200%_100%] animate-shimmer",
        pulse: "bg-muted animate-pulse-soft",
        card: "bg-gradient-to-br from-card/90 to-muted/30",
        button: "bg-primary/20",
      },
      size: {
        sm: "h-4",
        default: "h-6",
        lg: "h-8",
        xl: "h-12",
        button: "h-10",
        input: "h-9",
        card: "h-32",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, size, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// Preset skeleton components for common use cases
function SkeletonText({ lines = 3, className, ...props }: { lines?: number } & SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="default"
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("card-medical p-6 space-y-4", className)} {...props}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="medical" className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="medical" className="h-4 w-3/4" />
          <Skeleton variant="medical" className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} variant="medical" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="button" className="h-8 w-24 rounded-lg" />
        <Skeleton variant="medical" className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

function SkeletonForm({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton variant="medical" size="input" className="w-full rounded-xl" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton variant="medical" size="input" className="w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton variant="medical" size="input" className="w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton variant="medical" className="h-24 w-full rounded-xl" />
      </div>
      <Skeleton variant="button" size="button" className="w-full rounded-xl" />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonForm, skeletonVariants }
