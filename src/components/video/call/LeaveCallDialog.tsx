"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CALL_FOCUS, CALL_HIT_44 } from "./call-theme";
import { HangUpIcon } from "./CallControls";

const CHOICE =
  "flex w-full items-center gap-3 rounded-[14px] border border-white/[0.09] bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50";

/**
 * "Leave call" choice. Leaving never completes a visit: only `onComplete` does, and it is
 * offered to doctors only (`canComplete`).
 */
export function LeaveCallDialog({
  open,
  onOpenChange,
  canComplete,
  isCompleting = false,
  leaveHint,
  onLeave,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Doctor roles only. */
  canComplete: boolean;
  isCompleting?: boolean;
  /** Line under "Leave call". */
  leaveHint: string;
  onLeave: () => void;
  onComplete?: () => void;
}) {
  const stayRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => (isCompleting ? undefined : onOpenChange(next))}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          // Start on the safe choice.
          event.preventDefault();
          stayRef.current?.focus();
        }}
        className="flex w-[380px] max-w-[calc(100%-2rem)] flex-col gap-3 rounded-[20px] border border-white/[0.14] bg-[#18223a] p-5 text-white shadow-[0_30px_70px_rgba(0,0,0,0.6)] dark:border-white/[0.14] sm:max-w-[380px]"
      >
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="text-[17px] font-extrabold text-white">Leave call</DialogTitle>
          <DialogClose
            disabled={isCompleting}
            aria-label="Close"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-[#9aa7bd] transition-colors hover:bg-white/[0.14] hover:text-white disabled:opacity-50",
              CALL_FOCUS,
              CALL_HIT_44,
            )}
          >
            <X className="size-[15px]" aria-hidden="true" />
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          {canComplete
            ? "Leave the call and keep the visit open, or complete the visit and end the appointment."
            : "Leave the call or stay."}
        </DialogDescription>

        <button type="button" disabled={isCompleting} onClick={onLeave} className={cn(CHOICE, CALL_FOCUS)}>
          <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[#e2e8f0]">
            <HangUpIcon className="size-[18px]" />
          </span>
          <span className="flex min-w-0 flex-col gap-px">
            <span className="text-[14px] font-bold text-white">Leave call</span>
            <span className="text-[12px] font-medium text-[#9aa7bd]">{leaveHint}</span>
          </span>
        </button>

        {canComplete && onComplete ? (
          <button type="button" disabled={isCompleting} onClick={onComplete} className={cn(CHOICE, CALL_FOCUS)}>
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-[#f43f5e]/[0.16] text-[#fb7185]">
              {isCompleting ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <HangUpIcon className="size-[18px]" />}
            </span>
            <span className="flex min-w-0 flex-col gap-px">
              <span className="text-[14px] font-bold text-[#fda4af]">Complete &amp; end appointment</span>
              <span className="text-[12px] font-medium text-[#9aa7bd]">
                {isCompleting ? "Completing the visit…" : "Mark the visit as complete and close"}
              </span>
            </span>
          </button>
        ) : null}

        <button
          ref={stayRef}
          type="button"
          disabled={isCompleting}
          onClick={() => onOpenChange(false)}
          className={cn(
            "flex min-h-[44px] w-full items-center justify-center rounded-[12px] border border-white/[0.16] text-[14px] font-bold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50",
            CALL_FOCUS,
          )}
        >
          Stay in call
        </button>
      </DialogContent>
    </Dialog>
  );
}
