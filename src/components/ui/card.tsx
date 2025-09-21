import * as React from "react"

import { cn } from "@/lib/utils"

// Optimized Card components for 100K users with React.memo

const cardVariants = {
  default: "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
  medical: "card-medical flex flex-col gap-6 py-6",
  "medical-hover": "card-medical card-hover-lift flex flex-col gap-6 py-6",
  "medical-glow": "card-medical card-glow flex flex-col gap-6 py-6",
  treatment: "bg-gradient-to-br from-card/90 to-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 flex flex-col gap-6 rounded-xl py-6",
  testimonial: "bg-gradient-to-br from-card via-card to-muted/20 border border-border/40 hover:border-primary/20 hover:shadow-lg transition-all duration-300 flex flex-col gap-6 rounded-xl py-6",
  consultation: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col gap-6 rounded-xl py-6",
  emergency: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/10 dark:to-rose-900/10 border border-red-200 dark:border-red-800 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 flex flex-col gap-6 rounded-xl py-6",
  wellness: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 flex flex-col gap-6 rounded-xl py-6",
  premium: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border border-purple-200 dark:border-purple-800 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 flex flex-col gap-6 rounded-xl py-6",
  interactive: "cursor-pointer hover:scale-105 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ease-out",
};

const Card = React.memo(React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    variant?: keyof typeof cardVariants;
    interactive?: boolean;
    glowOnHover?: boolean;
  }
>(function Card({ className, variant = "default", interactive, glowOnHover, ...props }, ref) {
  const computedClassName = React.useMemo(
    () => cn(
      cardVariants[variant],
      interactive && cardVariants.interactive,
      glowOnHover && "card-glow",
      className
    ),
    [className, variant, interactive, glowOnHover]
  )

  return (
    <div
      ref={ref}
      data-slot="card"
      className={computedClassName}
      {...props}
    />
  )
}))

const CardHeader = React.memo(React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardHeader({ className, ...props }, ref) {
  const computedClassName = React.useMemo(
    () => cn(
      "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
      className
    ),
    [className]
  )
  
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={computedClassName}
      {...props}
    />
  )
}))

const CardTitle = React.memo(React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardTitle({ className, ...props }, ref) {
  const computedClassName = React.useMemo(
    () => cn("leading-none font-semibold", className),
    [className]
  )
  
  return (
    <div
      ref={ref}
      data-slot="card-title"
      className={computedClassName}
      {...props}
    />
  )
}))

const CardDescription = React.memo(React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardDescription({ className, ...props }, ref) {
  const computedClassName = React.useMemo(
    () => cn("text-muted-foreground text-sm", className),
    [className]
  )
  
  return (
    <div
      ref={ref}
      data-slot="card-description"
      className={computedClassName}
      {...props}
    />
  )
}))

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

const CardContent = React.memo(React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardContent({ className, ...props }, ref) {
  const computedClassName = React.useMemo(
    () => cn("px-6", className),
    [className]
  )
  
  return (
    <div
      ref={ref}
      data-slot="card-content"
      className={computedClassName}
      {...props}
    />
  )
}))

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
