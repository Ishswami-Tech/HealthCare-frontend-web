"use client";

import * as React from "react";
import { MessageCircle, Mic, MicOff, MoreVertical, Video, VideoOff } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CallDeviceGroup, MeetPanel, VideoLayout } from "./call-types";
import { CallBadge, CallControlButton, CallDeviceList, CallLeaveButton } from "./CallControls";
import { CALL_MENU_SURFACE, CallMoreMenu } from "./CallMoreMenu";

export type PatientCallViewProps = {
  /** The doctor's name: "Dr. Chandrakumar Deshmukh". */
  title: string;
  /** "12:48 · Secure video call", or "Waiting for the doctor to join". */
  statusLabel: string;
  isLive: boolean;
  errorMessage?: string | null;
  /** The tiles (see `CallSpotlightStage`, `CallGridStage`, `CallStripStage`). */
  stage: React.ReactNode;

  panel: MeetPanel | null;
  /** A `CallSidePanel` (variant "patient") with its content. */
  panelContent?: React.ReactNode;
  onTogglePanel: (panel: MeetPanel) => void;
  onClosePanel: () => void;

  micOn: boolean;
  cameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  /** Microphone, speaker and camera lists, shown in the More menu. */
  deviceGroups?: CallDeviceGroup[];

  isSharingScreen: boolean;
  onStartShare: () => void;
  onStopShare: () => void;

  layout: VideoLayout;
  onLayoutChange: (layout: VideoLayout) => void;
  participantCount: number;
  unreadCount: number;

  /** Leaves the call. Leave out to hide the red button. */
  onLeave?: () => void;

  /** On small screens the stage fills the screen edge to edge (the real call page). */
  fullBleed?: boolean;
};

/** The patient's in-call screen: the doctor on a dark stage, own video on top, controls at the bottom. */
export function PatientCallView({
  title,
  statusLabel,
  isLive,
  errorMessage,
  stage,
  panel,
  panelContent,
  onTogglePanel,
  onClosePanel,
  micOn,
  cameraOn,
  onToggleMic,
  onToggleCamera,
  deviceGroups,
  isSharingScreen,
  onStartShare,
  onStopShare,
  layout,
  onLayoutChange,
  participantCount,
  unreadCount,
  onLeave,
  fullBleed = false,
}: PatientCallViewProps) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const hasPanel = Boolean(panel && panelContent);

  return (
    <div
      className={cn(
        "grid h-full w-full min-h-0 grid-cols-1 gap-5 text-white",
        hasPanel && "lg:grid-cols-[minmax(0,1fr)_320px]",
      )}
    >
      <div
        className={cn(
          "relative min-h-0 min-w-0 overflow-hidden bg-[#2b3a4e]",
          fullBleed ? "lg:rounded-[24px]" : "rounded-[24px]",
        )}
      >
        <div className="absolute inset-0">{stage}</div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] flex flex-col gap-[3px] bg-gradient-to-b from-[rgba(15,23,42,0.78)] to-[rgba(15,23,42,0)] px-4 pb-11 pr-[124px] pt-4 sm:px-[22px] sm:pr-[180px] sm:pt-[18px]">
          <span className="truncate text-[16px] font-bold text-white sm:text-[18px]">{title}</span>
          <span role="status" className="flex items-center gap-2 text-[13px] text-[#e2e8f0]">
            <span
              aria-hidden="true"
              className={cn("size-2 shrink-0 rounded-full", isLive ? "bg-[#ef4444]" : "bg-[#94a3b8]")}
            />
            <span className="truncate">{statusLabel}</span>
          </span>
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="absolute inset-x-4 top-[72px] z-30 rounded-xl border border-[#f43f5e]/40 bg-[#4c0519]/90 px-4 py-2.5 text-[13px] text-[#fecdd3]"
          >
            {errorMessage}
          </p>
        ) : null}

        <div
          role="group"
          aria-label="Call controls"
          className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-[28px] bg-[rgba(15,23,42,0.78)] px-3 py-2.5 sm:bottom-[22px] sm:gap-4 sm:px-[18px] sm:py-[14px]"
        >
          <CallControlButton
            label={micOn ? "Mute microphone" : "Unmute microphone"}
            tone="glass"
            size={52}
            off={!micOn}
            onClick={onToggleMic}
          >
            {micOn ? <Mic className="size-[22px]" aria-hidden="true" /> : <MicOff className="size-[22px]" aria-hidden="true" />}
          </CallControlButton>
          <CallControlButton
            label={cameraOn ? "Turn off camera" : "Turn on camera"}
            tone="glass"
            size={52}
            off={!cameraOn}
            onClick={onToggleCamera}
          >
            {cameraOn ? <Video className="size-[22px]" aria-hidden="true" /> : <VideoOff className="size-[22px]" aria-hidden="true" />}
          </CallControlButton>
          <CallControlButton
            label={unreadCount > 0 ? `Chat (${unreadCount} unread)` : "Chat"}
            tone="glass"
            size={52}
            active={panel === "chat"}
            aria-pressed={panel === "chat"}
            onClick={() => onTogglePanel("chat")}
          >
            <MessageCircle className="size-[22px]" aria-hidden="true" />
            <CallBadge count={unreadCount} tone="alert" className="border-[#1e293b]" />
          </CallControlButton>

          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger asChild>
              <CallControlButton label="More options" tone="glass" size={52} active={moreOpen}>
                <MoreVertical className="size-[22px]" aria-hidden="true" />
              </CallControlButton>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              sideOffset={18}
              align="center"
              collisionPadding={12}
              className={cn(CALL_MENU_SURFACE, "max-h-[min(70dvh,520px)] overflow-y-auto")}
            >
              <CallMoreMenu
                participantCount={participantCount}
                layout={layout}
                onOpenParticipants={() => {
                  setMoreOpen(false);
                  onTogglePanel("people");
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
                footer={
                  deviceGroups && deviceGroups.length > 0 ? (
                    <CallDeviceList groups={deviceGroups} onPicked={() => setMoreOpen(false)} />
                  ) : null
                }
              />
            </PopoverContent>
          </Popover>

          {onLeave ? <CallLeaveButton variant="stage" label="Leave call" onClick={onLeave} /> : null}
        </div>
      </div>

      {hasPanel ? (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClosePanel} />
          <aside className="fixed inset-x-0 bottom-0 z-50 h-[85dvh] overflow-hidden rounded-t-3xl lg:static lg:z-auto lg:h-auto lg:min-h-0 lg:rounded-[24px] lg:border lg:border-white/[0.08]">
            {panelContent}
          </aside>
        </>
      ) : null}
    </div>
  );
}
