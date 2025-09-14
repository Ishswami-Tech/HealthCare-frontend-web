import * as React from "react"

import { cn } from "@/lib/utils"

// Optimized Card components for 100K users with React.memo

const Card = React.memo(React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function Card({ className, ...props }, ref) {
  const computedClassName = React.useMemo(
    () => cn(
      "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
      className
    ),
    [className]
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
