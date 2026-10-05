"use client";

import * as React from "react";
import { Check, ChevronDown, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CALL_FOCUS, CALL_HIT_44 } from "./call-theme";
import type { CallDeviceGroup } from "./call-types";

/** The hang-up handset from the design boards. */
export function HangUpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-5 shrink-0", className)}
    >
      <path d="M3 14c5-4.6 13-4.6 18 0l-2.2 2.6-3.6-1.5v-2.4a10 10 0 0 0-6.4 0v2.4l-3.6 1.5z" />
    </svg>
  );
}

/** Small count on the corner of a round control. `video` = indigo, `alert` = unread messages. */
export function CallBadge({
  count,
  tone = "video",
  className,
}: {
  count: number;
  tone?: "video" | "alert";
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#131c2e] px-1 text-[11px] font-extrabold leading-none text-white",
        tone === "video" ? "bg-[#6366f1]" : "bg-[#e11d48]",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

type CallControlTone =
  /** Solid dark circle on the toolbar. */
  | "plain"
  /** See-through circle on top of the video. */
  | "glass"
  /** No own background (sits inside a pill). */
  | "bare";

type CallControlButtonProps = Omit<React.ComponentProps<"button">, "aria-label"> & {
  /** Accessible name; also the tooltip. */
  label: string;
  tone?: CallControlTone;
  /** A panel or menu this button opens is showing. */
  active?: boolean;
  /** The microphone or camera is switched off. */
  off?: boolean;
  /** 48 px (toolbar) or 52 px (on the video). */
  size?: 48 | 52;
};

/** Round in-call control. Always at least 48 px, with an accessible name and visible focus. */
export function CallControlButton({
  label,
  tone = "plain",
  active = false,
  off = false,
  size = 48,
  className,
  children,
  type = "button",
  ...rest
}: CallControlButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors [&_svg]:shrink-0",
        size === 52 ? "size-[52px]" : "size-12",
        CALL_FOCUS,
        off
          ? "bg-white text-[#0f172a] hover:bg-[#e2e8f0]"
          : active
            ? tone === "glass"
              ? "bg-white text-[#0f172a] hover:bg-[#e2e8f0]"
              : "border-2 border-[#a5b4fc]/55 bg-[#818cf8]/20 text-[#a5b4fc] hover:bg-[#818cf8]/30"
            : tone === "glass"
              ? "bg-white/[0.16] text-white hover:bg-white/25"
              : tone === "bare"
                ? "bg-transparent text-white hover:bg-white/10"
                : "bg-[#1f2a44] text-white hover:bg-[#2a3757]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Red "leave" control. The only red control in the call. */
export function CallLeaveButton({
  label = "Leave call",
  variant = "room",
  className,
  ...rest
}: Omit<React.ComponentProps<"button">, "aria-label" | "children"> & {
  label?: string;
  /** `room` = 84 x 48 (doctor toolbar), `stage` = 68 x 52 (patient controls). */
  variant?: "room" | "stage";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-white transition-colors",
        variant === "room"
          ? "h-12 w-[84px] bg-[#e11d48] hover:bg-[#be123c] max-md:w-[68px]"
          : "h-[52px] w-[68px] bg-[#dc2626] hover:bg-[#b91c1c]",
        CALL_FOCUS,
        className,
      )}
      {...rest}
    >
      <HangUpIcon className={variant === "stage" ? "size-[26px]" : "size-5"} />
    </button>
  );
}

/** Lists of devices to pick from (microphone, speaker, camera). */
export function CallDeviceList({
  groups,
  onPicked,
}: {
  groups: CallDeviceGroup[];
  onPicked?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {groups.map((group, index) => (
        <div key={group.label} className={cn(index > 0 && "mt-1 border-t border-white/[0.09] pt-2")}>
          <p className="px-3 pb-1 pt-1 text-[11px] font-extrabold uppercase tracking-[1px] text-[#9aa7bd]">
            {group.label}
          </p>
          {group.devices.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-[#9aa7bd]">No devices found</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {group.devices.map((device) => {
                const selected = device.id === group.currentId;
                return (
                  <button
                    key={device.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      group.onSelect(device.id);
                      onPicked?.();
                    }}
                    className={cn(
                      "flex min-h-[44px] w-full items-center gap-2 rounded-[10px] px-3 text-left text-[12px] font-semibold transition-colors",
                      CALL_FOCUS,
                      selected ? "bg-[#818cf8]/[0.16] text-[#a5b4fc]" : "text-white hover:bg-white/[0.08]",
                    )}
                  >
                    <Check className={cn("size-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                    <span className="min-w-0 truncate">{device.label || "Default"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Microphone or camera control with a small arrow that opens the device list. */
export function CallMediaControl({
  kind,
  isOn,
  onToggle,
  deviceGroups,
}: {
  kind: "microphone" | "camera";
  isOn: boolean;
  onToggle: () => void;
  /** Devices to switch between. The arrow is hidden when this is empty. */
  deviceGroups?: CallDeviceGroup[];
}) {
  const [open, setOpen] = React.useState(false);
  const isMic = kind === "microphone";
  const label = isMic
    ? isOn
      ? "Mute microphone"
      : "Unmute microphone"
    : isOn
      ? "Turn off camera"
      : "Turn on camera";
  const Icon = isMic ? (isOn ? Mic : MicOff) : isOn ? Video : VideoOff;
  const hasDevices = Boolean(deviceGroups && deviceGroups.length > 0);

  return (
    <span className={cn("inline-flex items-center rounded-full bg-[#1f2a44]", hasDevices && "pr-1")}>
      <CallControlButton label={label} tone="bare" off={!isOn} onClick={onToggle}>
        <Icon className="size-5" aria-hidden="true" />
      </CallControlButton>
      {hasDevices && deviceGroups ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={isMic ? "Choose microphone and speaker" : "Choose camera"}
              title={isMic ? "Choose microphone and speaker" : "Choose camera"}
              className={cn(
                "flex size-[26px] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white transition-colors hover:bg-white/20",
                CALL_FOCUS,
                CALL_HIT_44,
                "after:left-[calc(50%+5px)]",
              )}
            >
              <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            sideOffset={14}
            align="center"
            className="z-[200] w-[240px] max-w-[85vw] rounded-2xl border border-white/[0.14] bg-[#1f2a44] p-1.5 text-white shadow-[0_20px_44px_rgba(0,0,0,0.5)]"
          >
            <CallDeviceList groups={deviceGroups} onPicked={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
      ) : null}
    </span>
  );
}
