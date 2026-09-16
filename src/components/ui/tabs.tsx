"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils/index"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

/**
 * Segmented tab rail — ONE shape for every role (patient, doctor, clinic admin,
 * receptionist, pharmacy, queue, EHR, analytics, super admin).
 *
 * Pages must not pass layout or colour classes here. Every screen used to
 * invent its own grid / boxed / underline variant, which is why no two
 * dashboards had the same tabs. Style changes belong in this file only.
 */
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "scrollbar-hide inline-flex w-full max-w-full items-stretch justify-start gap-1 overflow-x-auto rounded-lg border border-border bg-muted/60 p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tab inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition-colors",
        "hover:text-foreground",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm",
        "[&>svg]:size-4 [&>svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Count pip for a tab label. Lives here so pages never hand-style a badge
 * inside a trigger — the active-state colours have to follow TabsTrigger.
 */
function TabsCount({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tabs-count"
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-sm bg-foreground/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none text-current",
        "group-data-[state=active]/tab:bg-white/25",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-hidden", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsCount }
