"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Camera, CameraOff, Loader2, Pencil, RefreshCw, Sun, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The dark camera panel of the QR scanner, without any camera code: it draws one of the
 * scanner states. `QRScanner` drives it with the real camera; the preview drives it with
 * fixtures.
 *
 *   idle        camera is off: a button turns it on
 *   starting    waiting for the camera
 *   scanning    camera is on: scan frame, torch and camera switch
 *   denied      the browser blocked the camera: how to fix it, and the code path
 *   unavailable no camera on this device: the code path
 *   checking    a code was read and is being checked
 */
export type ScannerStatus = "idle" | "starting" | "scanning" | "denied" | "unavailable" | "checking";

export interface ScannerFrameProps {
  status: ScannerStatus;
  /** The camera picture (fills the panel, under the overlays). */
  children?: ReactNode;
  /** Shown only when the running camera has a torch. */
  torch?: { on: boolean; onToggle: () => void } | null;
  /** Shown only when the device has more than one camera. */
  onSwitchCamera?: (() => void) | null;
  /** Turns the camera on (idle), or tries again (denied / unavailable). */
  onStart?: () => void;
  /** Turns the camera off while scanning. */
  onStop?: () => void;
  /** Opens the "type the code" path. Offered whenever the camera cannot be used. */
  onEnterCode?: () => void;
  className?: string;
}

const HUD_BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-[#0f172a]/60 px-3.5 text-[13px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-[#0f172a]/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#34d399]";

function Message({
  icon: Icon,
  spin = false,
  tone = "mint",
  title,
  text,
  children,
}: {
  icon: typeof Camera;
  spin?: boolean;
  tone?: "mint" | "amber";
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#1f2937] px-6 text-center">
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          tone === "amber" ? "bg-[#fbbf24]/15 text-[#fcd34d]" : "bg-[#34d399]/15 text-[#6ee7b7]",
        )}
        aria-hidden="true"
      >
        <Icon className={cn("size-7", spin && "animate-spin")} strokeWidth={2} />
      </span>
      <h2 className="m-0 text-lg font-extrabold text-white">{title}</h2>
      {text ? <p className="m-0 max-w-[420px] text-sm leading-relaxed text-[#cbd5e1]">{text}</p> : null}
      {children ? <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">{children}</div> : null}
    </div>
  );
}

export function ScannerFrame({
  status,
  children,
  torch,
  onSwitchCamera,
  onStart,
  onStop,
  onEnterCode,
  className,
}: ScannerFrameProps) {
  const enterCode = onEnterCode ? (
    <Button size="md" onClick={onEnterCode}>
      <Pencil aria-hidden="true" />
      Enter the desk code
    </Button>
  ) : null;
  const tryAgain = onStart ? (
    <Button
      size="md"
      variant="outline"
      className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white dark:bg-transparent"
      onClick={onStart}
    >
      <RefreshCw aria-hidden="true" />
      Try again
    </Button>
  ) : null;

  return (
    <div
      className={cn(
        "relative isolate h-[420px] overflow-hidden rounded-[24px] bg-[#1f2937] text-white sm:h-[460px]",
        className,
      )}
    >
      <div className="absolute inset-0 z-0">{children}</div>

      {status === "scanning" ? (
        <>
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden="true">
            <div className="relative size-[240px] max-w-[72%]">
              <svg viewBox="0 0 200 200" className="absolute inset-0 size-full">
                <path
                  d="M4 40V14a10 10 0 0 1 10-10h26M160 4h26a10 10 0 0 1 10 10v26M196 160v26a10 10 0 0 1-10 10h-26M40 196H14a10 10 0 0 1-10-10v-26"
                  stroke="#34d399"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <LazyMotion features={domAnimation}>
                <m.span
                  initial={{ top: "12%" }}
                  animate={{ top: "86%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                  className="absolute inset-x-[8%] h-[3px] rounded-full bg-[#34d399] shadow-[0_-6px_14px_2px_rgba(52,211,153,0.35)]"
                />
              </LazyMotion>
            </div>
          </div>
          <div className="absolute right-4 top-4 z-30 flex items-center gap-2">
            {onSwitchCamera ? (
              <button type="button" className={HUD_BUTTON} onClick={onSwitchCamera} aria-label="Switch camera">
                <SwitchCamera className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
              </button>
            ) : null}
            {torch ? (
              <button
                type="button"
                className={cn(HUD_BUTTON, torch.on && "bg-white text-[#0f172a] hover:bg-white")}
                onClick={torch.onToggle}
                aria-pressed={torch.on}
              >
                <Sun className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                Torch
              </button>
            ) : null}
          </div>
          {onStop ? (
            <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center">
              <button type="button" className={HUD_BUTTON} onClick={onStop}>
                <CameraOff className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
                Stop camera
              </button>
            </div>
          ) : null}
          <p className="sr-only" role="status">
            Camera is on. Point it at the clinic QR code.
          </p>
        </>
      ) : null}

      {status === "idle" ? (
        <Message icon={Camera} title="Turn on the camera" text="The camera is used only to read the clinic QR code.">
          {onStart ? (
            <Button size="md" onClick={onStart}>
              <Camera aria-hidden="true" />
              Start camera
            </Button>
          ) : null}
        </Message>
      ) : null}

      {status === "starting" ? (
        <div role="status">
          <Message icon={Loader2} spin title="Starting the camera…" text="Allow camera access if your browser asks." />
        </div>
      ) : null}

      {status === "checking" ? (
        <div role="status">
          <Message icon={Loader2} spin title="Checking you in…" text="We are checking the code, your visit and your location." />
        </div>
      ) : null}

      {status === "denied" ? (
        <div role="alert">
          <Message
            icon={CameraOff}
            tone="amber"
            title="Camera access is blocked"
            text="Allow the camera for this site in your browser settings, then try again. Or type the code printed under the QR at the desk."
          >
            {enterCode}
            {tryAgain}
          </Message>
        </div>
      ) : null}

      {status === "unavailable" ? (
        <div role="alert">
          <Message
            icon={CameraOff}
            tone="amber"
            title="We could not use a camera"
            text="This device has no camera we can open, or another app is using it. Type the code printed under the QR at the desk."
          >
            {enterCode}
            {tryAgain}
          </Message>
        </div>
      ) : null}
    </div>
  );
}
