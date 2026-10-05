"use client";

import * as React from "react";
import { FileText, MessageCircle, MonitorUp, MonitorX, MoreVertical, Pill, Users, Video } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CALL_FOCUS, CALL_HIT_44, CALL_MENU_ROW, CALL_STAGE_BACKGROUND } from "./call-theme";
import type { CallDeviceGroup, MeetPanel, VideoLayout } from "./call-types";
import { CallBadge, CallControlButton, CallLeaveButton, CallMediaControl } from "./CallControls";
import { CALL_MENU_SURFACE, CallMoreMenu } from "./CallMoreMenu";

export type CallRoomViewProps = {
  /** "Dr. Chandrakumar Deshmukh • Aadesh Bhujbal" */
  title: string;
  /** "2 participants" or "Waiting for others…" */
  subtitle: string;
  /** "Live", "Connecting"… */
  stateLabel: string;
  isLive: boolean;
  isPresenting?: boolean;
  errorMessage?: string | null;
  /** The tiles (see `CallSpotlightStage`, `CallGridStage`, `CallStripStage`). */
  stage: React.ReactNode;
  /**
   * Start the tiles below the title and the action buttons. Use it when the stage shows
   * several tiles side by side (grid, strip, screen sharing), so nothing covers a face.
   */
  stageInsetTop?: boolean;
  /** Short note on the stage, for example "Waiting for Aadesh…". */
  stageNotice?: { title: string; description?: string } | null;
  /** Doctor only: opens the patient record in a new tab so the call keeps running. */
  caseSheetHref?: string;
  /** Doctor only: opens the prescription dialog. */
  onPrescribe?: () => void;

  panel: MeetPanel | null;
  /** A `CallSidePanel` with its content. */
  panelContent?: React.ReactNode;
  onTogglePanel: (panel: MeetPanel) => void;
  onClosePanel: () => void;

  /** "11:04 am" */
  clockLabel: string;
  /** "7F3A9C2E" */
  sessionLabel: string;

  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  micDevices?: CallDeviceGroup[];
  cameraDevices?: CallDeviceGroup[];

  isSharingScreen: boolean;
  onStartShare: () => void;
  onStopShare: () => void;

  layout: VideoLayout;
  onLayoutChange: (layout: VideoLayout) => void;
  participantCount: number;
  unreadCount: number;

  /** Opens the "Leave call" choice. Leave out to hide the red button. */
  onLeave?: () => void;

  /** On small screens the room fills the screen edge to edge (the real call page). */
  fullBleed?: boolean;
  /** Preview only: start with the "More options" menu open. */
  defaultMoreOpen?: boolean;
};

const STAGE_ACTION =
  "inline-flex min-h-[38px] items-center gap-2 whitespace-nowrap rounded-xl px-[14px] text-[13px] font-bold text-white transition-colors";

/** Doctor and staff call room: stage, side panel and the bottom toolbar. Props only, no call logic. */
export function CallRoomView({
  title,
  subtitle,
  stateLabel,
  isLive,
  isPresenting = false,
  errorMessage,
  stage,
  stageInsetTop = false,
  stageNotice,
  caseSheetHref,
  onPrescribe,
  panel,
  panelContent,
  onTogglePanel,
  onClosePanel,
  clockLabel,
  sessionLabel,
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  micDevices,
  cameraDevices,
  isSharingScreen,
  onStartShare,
  onStopShare,
  layout,
  onLayoutChange,
  participantCount,
  unreadCount,
  onLeave,
  fullBleed = false,
  defaultMoreOpen = false,
}: CallRoomViewProps) {
  const [moreOpen, setMoreOpen] = React.useState(defaultMoreOpen);
  const [shareOpen, setShareOpen] = React.useState(false);
  const hasActions = Boolean(caseSheetHref || onPrescribe);

  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 flex-col overflow-hidden bg-[#101828] text-white",
        fullBleed
          ? "lg:rounded-[24px] lg:border lg:border-white/[0.09] lg:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
          : "rounded-[24px] border border-white/[0.09] shadow-[0_24px_60px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="flex min-h-0 flex-1">
        {/* Stage */}
        <div className="relative min-w-0 flex-1 p-1.5 sm:p-3">
          <div className="relative h-full w-full overflow-hidden rounded-[18px]" style={{ background: CALL_STAGE_BACKGROUND }}>
            <div
              className={cn(
                "absolute inset-0",
                stageInsetTop && (hasActions ? "pt-[108px] sm:pt-[118px]" : "pt-[60px] sm:pt-[68px]"),
              )}
            >
              {stage}
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="absolute inset-x-[14px] top-[14px] z-30 rounded-xl border border-[#f43f5e]/40 bg-[#4c0519]/90 px-4 py-2.5 text-[13px] text-[#fecdd3]"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-20 flex items-start justify-between gap-2 sm:inset-x-[14px] sm:top-[14px]">
              <div className="pointer-events-auto flex min-w-0 items-center gap-2.5 rounded-[14px] border border-white/[0.09] bg-[rgba(8,12,22,0.66)] py-2 pl-2 pr-3">
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#4f46e5]">
                  <Video className="size-[13px] text-white" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col leading-[1.25]">
                  <span className="truncate text-[13px] font-bold text-white">{title}</span>
                  <span className="truncate text-[11px] text-[#9aa7bd]">{subtitle}</span>
                </span>
              </div>

              <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
                {isPresenting ? (
                  <span className="hidden items-center gap-1.5 rounded-[9px] border border-[#a5b4fc]/45 bg-[#818cf8]/20 px-2.5 py-[5px] text-[11px] font-extrabold uppercase tracking-[0.8px] text-[#a5b4fc] md:flex">
                    <MonitorUp className="size-3" aria-hidden="true" />
                    Presenting
                  </span>
                ) : null}
                <span
                  role="status"
                  className={cn(
                    "flex items-center gap-1.5 rounded-[9px] border px-2.5 py-[5px] text-[11px] font-extrabold uppercase tracking-[0.8px]",
                    isLive
                      ? "border-[#34d399]/40 bg-[#10b981]/[0.16] text-[#6ee7b7]"
                      : "border-white/[0.12] bg-white/[0.08] text-[#9aa7bd]",
                  )}
                >
                  {isLive ? <span className="size-1.5 rounded-full bg-[#34d399]" aria-hidden="true" /> : null}
                  {stateLabel}
                </span>
              </div>
            </div>

            {hasActions ? (
              <div className="absolute left-2.5 top-[62px] z-20 flex items-center gap-2 sm:left-[14px] sm:top-[70px]">
                {caseSheetHref ? (
                  <a
                    href={caseSheetHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Case sheet (opens in a new tab)"
                    className={cn(
                      STAGE_ACTION,
                      "border border-white/[0.16] bg-[rgba(8,12,22,0.66)] hover:bg-[rgba(8,12,22,0.85)]",
                      CALL_FOCUS,
                      CALL_HIT_44,
                    )}
                  >
                    <FileText className="size-[15px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
                    Case sheet
                  </a>
                ) : null}
                {onPrescribe ? (
                  <button
                    type="button"
                    onClick={onPrescribe}
                    className={cn(
                      STAGE_ACTION,
                      "bg-[#047857] shadow-[0_8px_18px_rgba(4,120,87,0.35)] hover:bg-[#065f46]",
                      CALL_FOCUS,
                      CALL_HIT_44,
                    )}
                  >
                    <Pill className="size-[15px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
                    Prescribe
                  </button>
                ) : null}
              </div>
            ) : null}

            {stageNotice ? (
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4",
                  hasActions ? "top-[116px] sm:top-[124px]" : "top-[68px] sm:top-[76px]",
                )}
              >
                <div role="status" className="max-w-xs rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.72)] px-4 py-3 text-center">
                  <p className="text-[13px] font-semibold text-white sm:text-[14px]">{stageNotice.title}</p>
                  {stageNotice.description ? (
                    <p className="mt-0.5 text-[11px] text-[#9aa7bd]">{stageNotice.description}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Side panel: a sheet from the bottom on small screens, a column on wide screens */}
        {panel && panelContent ? (
          <>
            <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClosePanel} />
            <div className="fixed inset-x-0 bottom-0 z-50 h-[85dvh] overflow-hidden rounded-t-3xl lg:static lg:z-auto lg:h-auto lg:w-[340px] lg:shrink-0 lg:rounded-none lg:border-l lg:border-white/[0.09]">
              {panelContent}
            </div>
          </>
        ) : null}
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-4 border-t border-white/[0.09] bg-[#131c2e] px-3 py-3 sm:px-5 sm:py-[14px]">
        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <span className="text-[14px] font-bold tabular-nums text-white">{clockLabel}</span>
          <span className="select-none text-white/20" aria-hidden="true">
            |
          </span>
          <span className="truncate text-[12px] tracking-[0.6px] text-[#9aa7bd]">Session {sessionLabel}</span>
        </div>

        <div className="flex flex-1 items-center justify-between gap-2.5 md:justify-center lg:flex-none" role="group" aria-label="Call controls">
          <CallMediaControl kind="microphone" isOn={micOn} onToggle={onToggleMic} deviceGroups={micDevices} />
          <CallMediaControl kind="camera" isOn={cameraOn} onToggle={onToggleCamera} deviceGroups={cameraDevices} />

          {/* Present (wide screens; on phones it is in the More menu) */}
          <span className="hidden md:inline-flex">
            {isSharingScreen ? (
              <Popover open={shareOpen} onOpenChange={setShareOpen}>
                <PopoverTrigger asChild>
                  <CallControlButton label="Presenting your screen" active>
                    <MonitorUp className="size-5" aria-hidden="true" />
                  </CallControlButton>
                </PopoverTrigger>
                <PopoverContent side="top" sideOffset={14} align="center" className={CALL_MENU_SURFACE}>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShareOpen(false);
                        onStartShare();
                      }}
                      className={cn(CALL_MENU_ROW, CALL_FOCUS)}
                    >
                      <MonitorUp className="size-[17px] shrink-0 text-[#9aa7bd]" aria-hidden="true" />
                      Present something else
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShareOpen(false);
                        onStopShare();
                      }}
                      className={cn(CALL_MENU_ROW, CALL_FOCUS)}
                    >
                      <MonitorX className="size-[17px] shrink-0 text-[#9aa7bd]" aria-hidden="true" />
                      Stop sharing
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <CallControlButton label="Present your screen" onClick={onStartShare}>
                <MonitorUp className="size-5" aria-hidden="true" />
              </CallControlButton>
            )}
          </span>

          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger asChild>
              <CallControlButton label="More options" active={moreOpen} className="max-md:order-last">
                <MoreVertical className="size-5" aria-hidden="true" />
                <CallBadge count={unreadCount} tone="alert" className="md:hidden" />
              </CallControlButton>
            </PopoverTrigger>
            <PopoverContent side="top" sideOffset={14} align="center" collisionPadding={12} className={CALL_MENU_SURFACE}>
              <CallMoreMenu
                participantCount={participantCount}
                unreadCount={unreadCount}
                layout={layout}
                onOpenParticipants={() => {
                  setMoreOpen(false);
                  onTogglePanel("people");
                }}
                onOpenMessages={() => {
                  setMoreOpen(false);
                  onTogglePanel("chat");
                }}
                onLayoutChange={(next) => {
                  onLayoutChange(next);
                  setMoreOpen(false);
                }}
                screenShare={{
                  isSharing: isSharingScreen,
                  onToggle: () => {
                    setMoreOpen(false);
                    if (isSharingScreen) onStopShare();
                    else onStartShare();
                  },
                }}
                screenShareClassName="md:hidden"
              />
            </PopoverContent>
          </Popover>

          {onLeave ? <CallLeaveButton label="Leave call" onClick={onLeave} /> : null}
        </div>

        <div className="hidden flex-1 items-center justify-end gap-2.5 md:flex">
          <CallControlButton
            label={`Participants (${participantCount})`}
            active={panel === "people"}
            aria-pressed={panel === "people"}
            onClick={() => onTogglePanel("people")}
          >
            <Users className="size-5" aria-hidden="true" />
            <CallBadge count={participantCount} tone="video" />
          </CallControlButton>
          <CallControlButton
            label={unreadCount > 0 ? `In-call messages (${unreadCount} unread)` : "In-call messages"}
            active={panel === "chat"}
            aria-pressed={panel === "chat"}
            onClick={() => onTogglePanel("chat")}
          >
            <MessageCircle className="size-5" aria-hidden="true" />
            <CallBadge count={unreadCount} tone="alert" />
          </CallControlButton>
        </div>
      </div>
    </div>
  );
}
