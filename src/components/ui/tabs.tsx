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
        "scrollbar-hide inline-flex max-w-full items-stretch justify-start gap-1 self-start overflow-x-auto rounded-[13px] bg-[#e8eef5] p-1 dark:bg-white/10",
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
        "group/tab inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-[18px] text-sm font-medium text-ink-soft transition-colors",
        "hover:text-foreground",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-card data-[state=active]:font-bold data-[state=active]:text-brand data-[state=active]:shadow-[0_1px_3px_rgba(15,27,45,0.12)]",
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
        "inline-flex h-5 min-w-[22px] items-center justify-center rounded-full bg-[#dbe3ec] px-1.5 text-[11px] font-extrabold leading-none text-ink-soft dark:bg-white/10",
        "group-data-[state=active]/tab:bg-mint group-data-[state=active]/tab:text-brand-dark",
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
