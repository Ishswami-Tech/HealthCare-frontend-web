"use client";

import * as React from "react";
import { Check, LayoutGrid, LayoutPanelLeft, MessageCircle, MonitorUp, MonitorX, Scan, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALL_FOCUS, CALL_MENU_ROW } from "./call-theme";
import type { VideoLayout } from "./call-types";

const LAYOUT_OPTIONS: Array<{ id: VideoLayout; label: string; icon: React.ElementType }> = [
  { id: "auto", label: "Auto", icon: LayoutGrid },
  { id: "spotlight", label: "Spotlight", icon: Scan },
  { id: "tiled", label: "Tiled", icon: LayoutPanelLeft },
];

/**
 * The "More options" list: participants, messages, screen sharing and the stage layout.
 * Each `on…` handler should also close the popover that holds this menu.
 */
export function CallMoreMenu({
  participantCount,
  unreadCount = 0,
  layout,
  onOpenParticipants,
  onOpenMessages,
  onLayoutChange,
  screenShare,
  screenShareClassName,
  footer,
}: {
  participantCount: number;
  unreadCount?: number;
  layout: VideoLayout;
  onOpenParticipants: () => void;
  /** Leave out to hide the messages row (when the screen already has a chat button). */
  onOpenMessages?: () => void;
  onLayoutChange: (layout: VideoLayout) => void;
  /** Shows a "Present screen" row. */
  screenShare?: { isSharing: boolean; onToggle: () => void };
  /** For example `md:hidden` when the toolbar already has a present button on wide screens. */
  screenShareClassName?: string;
  /** Extra content under the layout list (device lists on the patient screen). */
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {screenShare ? (
        <button type="button" onClick={screenShare.onToggle} className={cn(CALL_MENU_ROW, CALL_FOCUS, screenShareClassName)}>
          {screenShare.isSharing ? (
            <MonitorX className="size-[17px] shrink-0 text-[#a5b4fc]" aria-hidden="true" />
          ) : (
            <MonitorUp className="size-[17px] shrink-0 text-[#9aa7bd]" aria-hidden="true" />
          )}
          <span className="flex-1">{screenShare.isSharing ? "Stop presenting" : "Present screen"}</span>
        </button>
      ) : null}

      <button type="button" onClick={onOpenParticipants} className={cn(CALL_MENU_ROW, CALL_FOCUS)}>
        <Users className="size-[17px] shrink-0 text-[#9aa7bd]" aria-hidden="true" />
        <span className="flex-1">Participants</span>
        {participantCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6366f1] px-1 text-[11px] font-extrabold text-white">
            {participantCount > 9 ? "9+" : participantCount}
          </span>
        ) : null}
      </button>

      {onOpenMessages ? (
        <button type="button" onClick={onOpenMessages} className={cn(CALL_MENU_ROW, CALL_FOCUS)}>
          <MessageCircle className="size-[17px] shrink-0 text-[#9aa7bd]" aria-hidden="true" />
          <span className="flex-1">In-call messages</span>
          {unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e11d48] px-1 text-[11px] font-extrabold text-white">
              <span className="sr-only">Unread: </span>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}

      <span className="my-1 h-px bg-white/[0.09]" aria-hidden="true" />
      <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-[1px] text-[#9aa7bd]">Layout</p>
      {LAYOUT_OPTIONS.map(({ id, label, icon: Icon }) => {
        const selected = layout === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onLayoutChange(id)}
            className={cn(
              CALL_MENU_ROW,
              CALL_FOCUS,
              selected && "bg-[#818cf8]/[0.16] text-[#a5b4fc] hover:bg-[#818cf8]/[0.22]",
            )}
          >
            <Icon className={cn("size-[17px] shrink-0", selected ? "text-[#a5b4fc]" : "text-[#9aa7bd]")} aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {selected ? <Check className="size-[15px] shrink-0" strokeWidth={2.6} aria-hidden="true" /> : null}
          </button>
        );
      })}

      {footer ? <div className="mt-1 border-t border-white/[0.09] pt-1">{footer}</div> : null}
    </div>
  );
}

/** Popover surface for the menus of the call. */
export const CALL_MENU_SURFACE =
  "z-[200] w-[236px] max-w-[92vw] rounded-2xl border border-white/[0.14] bg-[#1f2a44] p-1.5 text-white shadow-[0_20px_44px_rgba(0,0,0,0.5)]";
