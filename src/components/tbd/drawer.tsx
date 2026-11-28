"use client";

import type { CSSProperties, ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { DialogCloseButton } from "./dialog";

/**
 * Right-hand side drawer of the portals (queue actions, filters, previews).
 * Same chrome as `DialogShell`: title row with the grey close square, scrolling body,
 * grey action bar that stays in view.
 *
 *   <SideDrawer open={open} onClose={close} title="Set priority" description="Asha K." width={440} busy={saving}>
 *     <SideDrawerBody>…fields…</SideDrawerBody>
 *     <SideDrawerActions><Button variant="outline" size="md">Cancel</Button><Button size="md">Save</Button></SideDrawerActions>
 *   </SideDrawer>
 *
 * Full width on a phone.
 */
export function SideDrawer({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  lead,
  width = 440,
  busy = false,
  className,
  children,
}: {
  open: boolean;
  onClose?: (() => void) | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  title: ReactNode;
  description?: ReactNode;
  /** Sits in front of the title (an `IconBox`). */
  lead?: ReactNode;
  /** Width in px at desktop size. Default 440. */
  width?: number;
  /** A request is running: the drawer cannot be dismissed. */
  busy?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return;
        onOpenChange?.(next);
        if (!next) onClose?.();
      }}
    >
      <SheetContent
        side="right"
        style={{ "--tbd-drawer-width": `${width}px` } as CSSProperties}
        className={cn(
          "w-full gap-0 p-0 sm:max-w-[min(var(--tbd-drawer-width),100%)]",
          // the stock sheet close button is replaced by the grey square in the title row
          "[&>button:last-child]:hidden",
          className,
        )}
      >
        <div className={cn("flex shrink-0 gap-3 border-b border-hair px-5 pb-3.5 pt-[22px] sm:px-6", lead ? "items-center" : "items-start")}>
          {lead}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <SheetTitle className="text-lg font-extrabold leading-tight text-ink">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="text-[13px] text-ink-muted">{description}</SheetDescription>
            ) : (
              <SheetDescription className="sr-only">{title}</SheetDescription>
            )}
          </div>
          <DialogCloseButton disabled={busy} />
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}

/** Scrolling body of a `SideDrawer`. */
export function SideDrawerBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6", className)}>{children}</div>;
}

/** Grey action bar of a `SideDrawer` (buttons on the right, main button last). */
export function SideDrawerActions({ hint, className, children }: { hint?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-hair bg-[#f8fafc] px-5 py-3.5 sm:px-6 dark:bg-white/5",
        className,
      )}
    >
      {hint ? <p className="m-0 min-w-[160px] flex-1 text-xs text-ink-muted">{hint}</p> : null}
      {children}
    </div>
  );
}
