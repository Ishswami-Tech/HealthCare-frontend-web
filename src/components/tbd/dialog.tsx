"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { CircleAlert, Loader2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Note } from "./primitives";

/**
 * Dialog chrome of the portals, on top of `ui/dialog` and `ui/alert-dialog`:
 *
 *   <DialogShell open={open} onClose={close} busy={saving} title="Add medicine" width={600}>
 *     <DialogBody>…fields…</DialogBody>
 *     <DialogActions>
 *       <Button variant="outline" size="md">Cancel</Button>
 *       <Button size="md">Save</Button>
 *     </DialogActions>
 *   </DialogShell>
 *
 * The shell has the title row with the grey close square, the body scrolls and the grey
 * action bar stays in view. `busy` blocks closing while a request runs.
 */

/** Side padding shared by the title row, the body and the action bar. */
const GUTTER = "px-5 sm:px-6";
const GUTTER_DENSE = "px-4 sm:px-6";

/** Class of the grey action bar, for the few footers that cannot use `<DialogActions>`. */
const ACTION_BAR =
  "flex shrink-0 flex-col-reverse gap-2.5 border-t border-hair bg-[#f8fafc] py-3.5 sm:flex-row sm:items-center sm:justify-end dark:bg-white/5";

const CLOSE_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50";

/** Max width at desktop size; never wider than the window minus its margin. */
const WIDTH = "sm:max-w-[min(var(--tbd-dialog-width),calc(100%-2rem))]";

const widthStyle = (width: number | undefined) =>
  width ? ({ "--tbd-dialog-width": `${width}px` } as CSSProperties) : undefined;

interface ShellLayout {
  plain: boolean;
  stretch: boolean;
  gutter: string;
}

const ShellLayoutContext = createContext<ShellLayout>({ plain: false, stretch: false, gutter: GUTTER });

/** The grey square close button of a dialog title row. */
export function DialogCloseButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <DialogClose disabled={disabled} className={CLOSE_BUTTON}>
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">Close</span>
    </DialogClose>
  );
}

export interface DialogShellProps {
  open: boolean;
  /** Called when the dialog is dismissed (close button, Escape, click outside). Not while `busy`. */
  onClose?: (() => void) | undefined;
  /** The Radix callback, for callers that keep the open flag themselves. Not called to close while `busy`. */
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** A request is running: the dialog cannot be closed and the close button is disabled. */
  busy?: boolean;
  title: ReactNode;
  description?: ReactNode;
  /** Sits in front of the title (an `IconBox`). The title row then centres on it. */
  lead?: ReactNode;
  /** Max width in px at desktop size (the boards use 460 – 880). Default 512. */
  width?: number;
  /** The dialog is a column capped at 92 % of the window: the body takes the free height and scrolls. */
  stretch?: boolean;
  /** The plain `ui/dialog` look: padded content, close button in the corner, buttons without the grey bar. */
  plain?: boolean;
  /** 16 px side padding on a phone instead of 20 (dialogs with wide rows). */
  dense?: boolean;
  /**
   * Keeps the close button of `ui/dialog` in the top right corner instead of the one in the
   * title row. The dialog then opens with its first control focused, not the close button.
   */
  cornerClose?: boolean;
  /** Extra classes for the dialog box. */
  className?: string;
  onOpenAutoFocus?: ((event: Event) => void) | undefined;
  /** The button that opens the dialog, when the dialog owns it. */
  trigger?: ReactNode;
  children: ReactNode;
}

/** Dialog with the standard title row. Put `<DialogBody>` and `<DialogActions>` inside. */
export function DialogShell({
  open,
  onClose,
  onOpenChange,
  busy = false,
  title,
  description,
  lead,
  width,
  stretch = false,
  plain = false,
  dense = false,
  cornerClose = false,
  className,
  onOpenAutoFocus,
  trigger,
  children,
}: DialogShellProps) {
  const layout: ShellLayout = { plain, stretch, gutter: dense ? GUTTER_DENSE : GUTTER };
  const autoFocus = onOpenAutoFocus ? { onOpenAutoFocus } : {};
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing while the request runs would hide its result.
        if (!next && busy) return;
        onOpenChange?.(next);
        if (!next) onClose?.();
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <ShellLayoutContext.Provider value={layout}>
        {plain ? (
          <DialogContent className={cn(width ? WIDTH : null, className)} style={widthStyle(width)} {...autoFocus}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
            {children}
          </DialogContent>
        ) : (
          <DialogContent
            showCloseButton={cornerClose}
            className={cn(
              "gap-0 overflow-hidden p-0",
              stretch && "flex max-h-[92vh] flex-col",
              width ? WIDTH : null,
              className,
            )}
            style={widthStyle(width)}
            {...autoFocus}
          >
            <div
              className={cn(
                "flex shrink-0 gap-3 pb-3.5 pt-[22px]",
                lead ? "items-center gap-3.5" : "items-start",
                layout.gutter,
                cornerClose && "pr-16",
              )}
            >
              {lead}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <DialogTitle>{title}</DialogTitle>
                {description ? (
                  <DialogDescription className="break-words">{description}</DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">{title}</DialogDescription>
                )}
              </div>
              {cornerClose ? null : <DialogCloseButton disabled={busy} />}
            </div>
            {children}
          </DialogContent>
        )}
      </ShellLayoutContext.Provider>
    </Dialog>
  );
}

/** Scrolling body of a dialog: a column of blocks 16 px apart. */
export function DialogBody({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  const { plain, stretch, gutter } = useContext(ShellLayoutContext);
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        plain
          ? null
          : ["overflow-y-auto pb-5 pt-1", gutter, stretch ? "min-h-0 flex-1" : "max-h-[calc(100dvh-230px)]"],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Grey bar with the dialog buttons (stacked on a phone, main button first).
 * `start` sits on the left (Remove). `hint` is a short line on the left; the buttons then stay in one row.
 */
export function DialogActions({
  start,
  hint,
  className,
  children,
}: {
  start?: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const { plain, gutter } = useContext(ShellLayoutContext);
  if (plain) return <DialogFooter className={cn("gap-2.5", className)}>{children}</DialogFooter>;
  if (hint) {
    return (
      <div className={cn(ACTION_BAR, gutter, "flex-row flex-wrap items-center justify-end gap-x-2.5 gap-y-3", className)}>
        <p className="m-0 min-w-[200px] flex-1 text-xs text-ink-muted">{hint}</p>
        <div className="flex items-center gap-2.5">{children}</div>
      </div>
    );
  }
  return (
    <div className={cn(ACTION_BAR, gutter, className)}>
      {start ? <div className="flex sm:mr-auto [&>*]:w-full sm:[&>*]:w-auto">{start}</div> : null}
      {children}
    </div>
  );
}

/** Message of a failed request, shown inside the dialog so the form stays open. */
export function DialogError({ lead, message }: { lead?: string; message?: string | null | undefined }) {
  if (!message) return null;
  return (
    <Note tone="rose" icon={CircleAlert}>
      <span role="alert">{lead ? `${lead} ${message}` : message}</span>
    </Note>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  /** Called when the dialog is dismissed (Cancel, Escape, close button). Not while `busy`. */
  onClose?: (() => void) | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  title: ReactNode;
  description: ReactNode;
  /** Extra blocks under the description (the item being removed, an error note). */
  children?: ReactNode;
  confirmLabel: ReactNode;
  /** Label while `busy` ("Removing…"). */
  busyLabel?: ReactNode;
  cancelLabel?: ReactNode;
  confirmIcon?: ReactNode;
  /** `danger` = the red button, for removing something. */
  tone?: "default" | "danger";
  /** The request is running: nothing can be pressed and the dialog cannot be closed. */
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  /** Closes right after `onConfirm` (the action cannot fail in the dialog). Default: stays open. */
  closeOnConfirm?: boolean;
  /** Title row with the grey close square; the description is then the body text. */
  closeButton?: boolean;
  /** Max width in px at desktop size. */
  width?: number;
}

/** "Are you sure?" dialog. Cancel, Escape and the close button leave everything as it is. */
export function ConfirmDialog({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  busyLabel,
  cancelLabel = "Cancel",
  confirmIcon,
  tone = "default",
  busy = false,
  confirmDisabled = false,
  onConfirm,
  closeOnConfirm = false,
  closeButton = false,
  width = 460,
}: ConfirmDialogProps) {
  const change = (next: boolean) => {
    if (!next && busy) return;
    onOpenChange?.(next);
    if (!next) onClose?.();
  };
  return (
    <AlertDialog open={open} onOpenChange={change}>
      <AlertDialogContent className={cn("flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0", WIDTH)} style={widthStyle(width)}>
        {closeButton ? (
          <>
            <div className={cn("flex shrink-0 items-start gap-3 pb-3.5 pt-[22px]", GUTTER)}>
              <AlertDialogTitle className="min-w-0 flex-1 text-lg font-extrabold leading-tight text-ink">
                {title}
              </AlertDialogTitle>
              <AlertDialogPrimitive.Cancel disabled={busy} className={CLOSE_BUTTON}>
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </AlertDialogPrimitive.Cancel>
            </div>
            <div className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto pb-5 pt-1", GUTTER)}>
              <AlertDialogDescription className="text-sm leading-[1.55] text-ink-soft">
                {description}
              </AlertDialogDescription>
              {children}
            </div>
          </>
        ) : (
          <div className={cn("flex min-h-0 flex-col gap-4 overflow-y-auto pb-5 pt-[22px]", GUTTER)}>
            <div className="flex flex-col gap-1">
              <AlertDialogTitle className="text-lg font-extrabold leading-tight text-ink">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-ink-muted">{description}</AlertDialogDescription>
            </div>
            {children}
          </div>
        )}
        <div className={cn(ACTION_BAR, GUTTER)}>
          <AlertDialogPrimitive.Cancel asChild>
            <Button variant="outline" size="md" disabled={busy}>
              {cancelLabel}
            </Button>
          </AlertDialogPrimitive.Cancel>
          <Button
            variant={tone === "danger" ? "danger" : "default"}
            size="md"
            disabled={busy || confirmDisabled}
            onClick={() => {
              onConfirm();
              if (closeOnConfirm) change(false);
            }}
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : confirmIcon}
            {busy && busyLabel ? busyLabel : confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
