"use client";

import React from "react";
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  MessageSquare,
  MoreVertical,
  Video,
  VideoOff,
  Users,
  Send,
  X,
  MonitorUp,
  MonitorX,
  Volume2,
  LayoutGrid,
  Maximize2,
  LayoutPanelLeft,
} from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { nowIso } from "@/lib/utils/date-time";
import {
  DailyAudio,
  DailyProvider,
  DailyVideo,
  useActiveSpeakerId,
  useAppMessage,
  useDaily,
  useDailyError,
  useDevices,
  useLocalSessionId,
  useMeetingState,
  useParticipantIds,
  useParticipantProperty,
  useParticipantCounts,
  useScreenShare,
  useWaitingParticipants,
} from "@daily-co/daily-react";
import Daily from "@daily-co/daily-js";
import type { DailyCall, DailyMeetingState } from "@daily-co/daily-js";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showInfoToast, showErrorToast } from "@/hooks/utils/use-toast";
import { useCompleteAppointment } from "@/hooks/query/useAppointments";
import { cn } from "@/lib/utils";
import { getAvatarTone } from "@/lib/config/color-palette";
import type { VideoRoomAccess } from "@/components/video/VideoAppointmentRoomWorkspace";
import { isDoctorRole } from "@/components/video/daily-in-app-call-utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type MeetPanel = "chat" | "people";
type VideoLayout = "auto" | "spotlight" | "tiled";

interface DailyUserData {
  appointmentId: string;
  appointmentTitle: string;
  viewerRole: string;
  provider: string;
  doctorName?: string;
  patientName?: string;
  displayName?: string;
  name?: string;
}

type DailyAppMessage = {
  appointmentId: string;
  sentAt: string;
  source: "healthcarefrontend";
  text: string;
  senderName?: string;
  isLocal?: boolean;
};

type DailyInAppCallProps = {
  access: VideoRoomAccess;
  appointmentId: string;
  appointmentTitle: string;
  activePanel?: MeetPanel | null;
  viewerRole?: string;
  onLeave?: (() => void) | undefined;
  displayName: string;
  remoteNameFallback?: string;
  userData?: Record<string, unknown>;
  onOpenPanel?: (panel: MeetPanel | null) => void;
  renderPanelContent?: (panel: MeetPanel | null) => React.ReactNode;
};

// ─── Singleton call object ────────────────────────────────────────────────────
let sharedDailyCallObject: DailyCall | null = null;

function getOrCreateCallObject(): DailyCall {
  if (sharedDailyCallObject && !sharedDailyCallObject.isDestroyed()) {
    return sharedDailyCallObject;
  }
  sharedDailyCallObject = Daily.createCallObject({
    showLeaveButton: false,
    showFullscreenButton: false,
    showUserNameChangeUI: false,
    customLayout: true,
    subscribeToTracksAutomatically: true,
    startVideoOff: false,
    startAudioOff: false,
    allowMultipleCallInstances: true,
  });
  return sharedDailyCallObject;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMeetingStateLabel(state: DailyMeetingState | null) {
  switch (state) {
    case "joined-meeting":
      return "Live";
    case "joining-meeting":
      return "Connecting";
    case "loading":
      return "Loading";
    case "left-meeting":
      return "Left";
    case "error":
      return "Error";
    default:
      return "Connecting";
  }
}

function formatTimestamp(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(label: string): string {
  return (
    label
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function resolveParticipantName(
  rawUserName: string,
  userData: unknown,
  remoteNameFallback?: string | undefined,
  waitingForName?: string | undefined,
): string {
  const typed = userData as DailyUserData | undefined;
  const fromData =
    typed?.displayName ||
    typed?.name ||
    (userData as any)?.displayName ||
    (userData as any)?.name ||
    typed?.doctorName ||
    typed?.patientName ||
    (userData as any)?.doctorName ||
    (userData as any)?.patientName;
  const generic = ["Participant", "Guest", "Unknown", "User", "Doctor", "Patient"];
  return (
    fromData ||
    (rawUserName && !generic.includes(rawUserName) ? rawUserName : undefined) ||
    remoteNameFallback ||
    (waitingForName && (!rawUserName || generic.includes(rawUserName))
      ? waitingForName
      : undefined) ||
    "User"
  );
}

// Deterministic background color per participant name (Google Meet style)
const TILE_BG_COLORS = [
  "#1a237e", // deep indigo
  "#1b5e20", // deep green
  "#4a148c", // deep purple
  "#b71c1c", // deep red
  "#e65100", // deep orange
  "#006064", // deep teal
  "#37474f", // blue-grey
  "#4e342e", // deep brown
  "#1565c0", // deep blue
  "#558b2f", // light green dark
];

function getTileBgColor(name: string | undefined): string {
  const safeName = name || "User";
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TILE_BG_COLORS[Math.abs(hash) % TILE_BG_COLORS.length] ?? "#1a237e";
}

// ─── Shared loading screen (used across all video states) ────────────────────
function VideoLoadingScreen({
  message = "Getting ready…",
  sub = "",
}: {
  message?: string;
  sub?: string;
}) {
  return (
    <div className="flex h-full w-full min-h-[100dvh] items-center justify-center bg-[#111315] px-6 text-center text-white">
      <div className="gap-y-4 max-w-xs w-full">
        <div className="relative mx-auto size-14">
          <Loader2 className="h-full w-full animate-spin text-[#8ab4f8]/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="size-6 text-[#8ab4f8]" />
          </div>
        </div>
        <div>
          <p className="text-[16px] font-medium text-white">{message}</p>
          {sub && <p className="mt-1 text-[13px] text-[#9aa0a6]">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
function DeviceSelect({
  label,
  devices,
  currentDeviceId,
  onChange,
}: {
  label: string;
  devices: Array<{ device: MediaDeviceInfo; selected: boolean; state: string }>;
  currentDeviceId: string;
  onChange: (deviceId: string) => void | Promise<void>;
}) {
  return (
    <div className="gap-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a6]">
        {label}
      </p>
      <div className="relative">
        <select
          value={currentDeviceId}
          onChange={(e) => void onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-[#3c4043] bg-[#2d2e30] px-4 py-3 text-[13px] text-white outline-none transition-all cursor-pointer hover:border-[#5f6368] focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#8ab4f8]/30"
        >
          <option value="">Default device</option>
          {devices.map((d) => (
            <option key={d.device.deviceId} value={d.device.deviceId}>
              {d.device.label || d.device.deviceId}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0a6]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── DeviceChevronMenu — small ^ button next to mic/camera ───────────────────
function DeviceChevronMenu({
  label,
  devices,
  currentDeviceId,
  onChange,
  extraDevices,
  extraLabel,
  extraCurrentId,
  extraOnChange,
}: {
  label: string;
  devices: Array<{ device: MediaDeviceInfo; selected: boolean; state: string }>;
  currentDeviceId: string;
  onChange: (id: string) => void;
  extraDevices?: Array<{
    device: MediaDeviceInfo;
    selected: boolean;
    state: string;
  }>;
  extraLabel?: string;
  extraCurrentId?: string;
  extraOnChange?: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <m.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label={`Change ${label}`}
          title={`Change ${label}`}
          className="flex size-7 items-center justify-center rounded-full bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368] transition-all shrink-0 focus:outline-none"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 6.5L5 3.5L8 6.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </m.button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={10}
        align="center"
        style={{ width: "220px", maxWidth: "85vw" }}
        className="!w-auto rounded-2xl border border-[#3c4043] bg-[#202124] p-2 text-white shadow-2xl z-[200] overflow-hidden"
      >
        <div className="gap-y-2">
          {/* Primary device list */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a6] px-2">
              {label}
            </p>
            <div className="gap-y-0.5">
              {devices.length === 0 ? (
                <div className="px-2 py-1.5 text-[12px] text-[#5f6368]">
                  No devices found
                </div>
              ) : (
                devices.map((d) => (
                  <button
                    key={d.device.deviceId}
                    type="button"
                    onClick={() => {
                      onChange(d.device.deviceId);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] transition-colors text-left",
                      d.device.deviceId === currentDeviceId
                        ? "bg-[#8ab4f8]/15 text-[#8ab4f8]"
                        : "text-white hover:bg-white/8",
                    )}
                  >
                    <svg
                      className={cn(
                        "size-3 shrink-0",
                        d.device.deviceId === currentDeviceId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7L5.5 10.5L12 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="truncate min-w-0">
                      {d.device.label || "Default"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Extra device list (e.g. speakers alongside mic) */}
          {extraDevices && extraLabel && extraOnChange && (
            <>
              <div className="border-t border-white/10" />
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a6] px-2">
                  {extraLabel}
                </p>
                <div className="gap-y-0.5">
                  {extraDevices.map((d) => (
                    <button
                      key={d.device.deviceId}
                      type="button"
                      onClick={() => {
                        extraOnChange(d.device.deviceId);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] transition-colors text-left",
                        d.device.deviceId === (extraCurrentId || "")
                          ? "bg-[#8ab4f8]/15 text-[#8ab4f8]"
                          : "text-white hover:bg-white/8",
                      )}
                    >
                      <svg
                        className={cn(
                          "size-3 shrink-0",
                          d.device.deviceId === (extraCurrentId || "")
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 7L5.5 10.5L12 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="truncate min-w-0">
                        {d.device.label || "Default"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── MicGroup — mic button + ^ chevron ───────────────────────────────────────
function MicGroup({
  isOn,
  onToggle,
  devices,
  small,
}: {
  isOn: boolean;
  onToggle: () => void;
  devices: ReturnType<typeof useDevices>;
  small?: boolean;
}) {
  const size = small ? "size-11" : "size-14";
  const iconSize = small ? "size-5" : "size-6";

  return (
    <div className="flex items-center gap-1">
      <m.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={onToggle}
        aria-label={isOn ? "Mute microphone" : "Unmute microphone"}
        title={isOn ? "Mute microphone" : "Unmute microphone"}
        className={cn(
          "flex items-center justify-center rounded-full transition-all shrink-0 focus:outline-none",
          size,
          isOn
            ? "bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]"
            : "bg-[#ea4335] text-white hover:bg-[#d93025]",
        )}
      >
        {isOn ? <Mic className={iconSize} /> : <MicOff className={iconSize} />}
      </m.button>
      <DeviceChevronMenu
        label="Microphone"
        devices={devices.microphones}
        currentDeviceId={devices.currentMic?.device.deviceId || ""}
        onChange={(id) => devices.setMicrophone(id)}
        extraDevices={devices.speakers}
        extraLabel="Speaker"
        extraCurrentId={devices.currentSpeaker?.device.deviceId || ""}
        extraOnChange={(id) => devices.setSpeaker(id)}
      />
    </div>
  );
}

// ─── CameraGroup — camera button + ^ chevron ─────────────────────────────────
function CameraGroup({
  isOn,
  onToggle,
  devices,
  small,
}: {
  isOn: boolean;
  onToggle: () => void;
  devices: ReturnType<typeof useDevices>;
  small?: boolean;
}) {
  const size = small ? "size-11" : "size-14";
  const iconSize = small ? "size-5" : "size-6";

  return (
    <div className="flex items-center gap-1">
      <m.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={onToggle}
        aria-label={isOn ? "Turn off camera" : "Turn on camera"}
        title={isOn ? "Turn off camera" : "Turn on camera"}
        className={cn(
          "flex items-center justify-center rounded-full transition-all shrink-0 focus:outline-none",
          size,
          isOn
            ? "bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]"
            : "bg-[#ea4335] text-white hover:bg-[#d93025]",
        )}
      >
        {isOn ? (
          <Video className={iconSize} />
        ) : (
          <VideoOff className={iconSize} />
        )}
      </m.button>
      <DeviceChevronMenu
        label="Camera"
        devices={devices.cameras}
        currentDeviceId={devices.currentCam?.device.deviceId || ""}
        onChange={(id) => devices.setCamera(id)}
      />
    </div>
  );
}

// ─── ScreenShareMenu ──────────────────────────────────────────────────────────
function ScreenShareMenu({
  isSharingScreen,
  onStartShare,
  onStopShare,
}: {
  isSharingScreen: boolean;
  onStartShare: () => void;
  onStopShare: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  if (!isSharingScreen) {
    return (
      <ToolbarBtn
        icon={MonitorUp}
        label="Present now"
        active={false}
        small
        onClick={onStartShare}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <m.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Presenting"
          title="Presenting"
          className="flex size-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#8ab4f8]/20 text-[#8ab4f8] border-2 border-[#8ab4f8]/40 hover:bg-[#8ab4f8]/30 transition-all shrink-0 focus:outline-none"
        >
          <MonitorUp className="size-5 sm:h-6 sm:w-6" />
        </m.button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={12}
        align="center"
        className="w-64 rounded-2xl border border-[#3c4043] bg-[#2d2e30] p-1 text-white shadow-2xl z-[200]"
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onStartShare();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
        >
          <MonitorUp className="size-5 text-[#9aa0a6]" />
          Present something else
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onStopShare();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
        >
          <MonitorX className="size-5 text-[#9aa0a6]" />
          Stop sharing
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ─── ToolbarBtn ───────────────────────────────────────────────────────────────
type ToolbarBtnProps = {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  danger?: boolean;
  wide?: boolean;
  small?: boolean;
  onClick?: () => void;
  ref?: React.Ref<HTMLButtonElement> | undefined;
};

function ToolbarBtn({
  icon: Icon,
  label,
  active = false,
  danger = false,
  wide = false,
  small = false,
  onClick,
  ref,
  ...rest
}: ToolbarBtnProps) {
  return (
    <m.button
      ref={ref}
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        wide
          ? small
            ? "h-11 w-20 sm:h-14 sm:w-24"
            : "h-14 w-24"
          : small
            ? "size-11 sm:h-14 sm:w-14"
            : "size-14",
        danger
          ? "bg-[#ea4335] text-white hover:bg-[#d93025]"
          : active
            ? "border-2 border-[#8ab4f8]/40 bg-[#8ab4f8]/20 text-[#8ab4f8] hover:bg-[#8ab4f8]/30"
            : "bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]",
      )}
      {...rest}
    >
      <Icon
        className={cn("shrink-0", small ? "size-5 sm:h-6 sm:w-6" : "size-6")}
      />
      <span className="sr-only">{label}</span>
    </m.button>
  );
}

ToolbarBtn.displayName = "ToolbarBtn";

// ─── ParticipantTile ──────────────────────────────────────────────────────────
function ParticipantTile({
  sessionId,
  isLocal = false,
  localName,
  remoteNameFallback,
  waitingForName,
  isActiveSpeaker = false,
}: {
  sessionId: string;
  isLocal?: boolean | undefined;
  localName?: string | undefined;
  remoteNameFallback?: string | undefined;
  waitingForName?: string | undefined;
  isActiveSpeaker?: boolean | undefined;
}) {
  const [userName, videoState, audioState, userData] = useParticipantProperty(
    sessionId,
    ["user_name", "tracks.video.state", "tracks.audio.state", "userData"],
  );

  const rawName = String(userName || "").trim();
  const resolved = resolveParticipantName(
    rawName,
    userData,
    remoteNameFallback,
    waitingForName,
  );
  const label = isLocal ? (localName ? `${localName} (You)` : "You") : resolved;
  const videoOn = videoState === "playable";
  const audioOn = audioState === "playable";
  const initials = getInitials(label);
  const bgColor = getTileBgColor(label);

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl flex items-center justify-center transition-all duration-200"
      style={{
        backgroundColor: videoOn ? "#1e1f20" : bgColor,
        boxShadow: isActiveSpeaker
          ? "0 0 0 3px #8ab4f8, 0 0 0 5px rgba(138,180,248,0.2)"
          : "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      {videoOn ? (
        <DailyVideo
          sessionId={sessionId}
          type="video"
          automirror={isLocal}
          fit="cover"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Subtle white glow */}
          <div
            className="absolute inset-0 opacity-15"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.8) 0%, transparent 60%)",
                filter: "blur(8px)",
              }}
            />
          {/* Avatar circle — responsive size */}
          <div className="relative flex size-16 sm:h-24 sm:w-24 lg:h-28 lg:w-28 items-center justify-center rounded-full bg-white/15 border-2 border-white/25 shadow-2xl">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight select-none">
              {initials}
            </span>
          </div>
          {/* Active speaker pulse ring */}
          {isActiveSpeaker && (
            <m.div
              className="absolute inset-0 rounded-2xl"
              style={{ border: "2px solid #8ab4f8" }}
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </div>
      )}

      {/* Active speaker wave — bottom-right corner, away from LIVE badge and name tag */}
      {isActiveSpeaker && audioOn && (
        <div className="absolute bottom-8 right-2 flex items-center gap-[3px] rounded-full bg-black/60 backdrop-blur-sm border border-[#8ab4f8]/40 px-2 py-1">
          {[0, 1, 2].map((i) => (
            <m.div
              key={i}
              className="w-[3px] rounded-full bg-[#8ab4f8]"
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "bottom", height: "12px" }}
            />
          ))}
        </div>
      )}

      {/* Name tag — bottom-left, always visible */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-sm px-2 py-1 border border-white/10 max-w-[calc(100%-1rem)]">
        {!audioOn && <MicOff className="size-2.5 text-[#ea4335] shrink-0" />}
        <span className="truncate text-[10px] sm:text-[11px] font-medium text-white leading-none">
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── ScreenShareTile ──────────────────────────────────────────────────────────
function ScreenShareTile({
  sessionId,
  remoteNameFallback,
  waitingForName,
  isLocal,
  onStopShare,
}: {
  sessionId: string;
  remoteNameFallback?: string | undefined;
  waitingForName?: string | undefined;
  isLocal?: boolean | undefined;
  onStopShare?: (() => void) | undefined;
}) {
  const [userName, userData] = useParticipantProperty(sessionId, [
    "user_name",
    "userData",
  ]);
  const rawName = String(userName || "").trim();
  const label = resolveParticipantName(
    rawName,
    userData,
    remoteNameFallback,
    waitingForName,
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#1e1f20] ring-1 ring-white/5">
      <DailyVideo
        sessionId={sessionId}
        type="screenVideo"
        fit="contain"
        className="h-full w-full"
      />

      {/* You are presenting banner */}
      {isLocal && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 px-8 py-6 text-center max-w-sm pointer-events-auto">
            <MonitorUp className="mx-auto mb-3 size-10 text-[#8ab4f8]" />
            <p className="text-[18px] font-semibold text-white mb-1">
              You are presenting
            </p>
            <p className="text-[13px] text-[#9aa0a6] mb-4">
              Others can see your screen
            </p>
            {onStopShare && (
              <button
                type="button"
                onClick={onStopShare}
                className="flex items-center gap-2 mx-auto rounded-full bg-[#ea4335] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#d93025] transition-colors"
              >
                <MonitorX className="size-4" />
                Stop presenting
              </button>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/70 backdrop-blur-sm px-2.5 py-1.5 border border-white/10">
        <ScreenShare className="size-3.5 text-[#8ab4f8]" />
        <span className="text-[12px] font-medium text-white">
          {label}&apos;s screen
        </span>
      </div>
    </div>
  );
}

// ─── SidebarParticipantRow ────────────────────────────────────────────────────
function SidebarParticipantRow({
  sessionId,
  isLocal,
  localName,
  remoteNameFallback,
  waitingForName,
  isActiveSpeaker,
}: {
  sessionId: string;
  isLocal: boolean;
  localName: string;
  remoteNameFallback?: string | undefined;
  waitingForName?: string | undefined;
  isActiveSpeaker?: boolean | undefined;
}) {
  const [userName, audioState, userData] = useParticipantProperty(sessionId, [
    "user_name",
    "tracks.audio.state",
    "userData",
  ]);
  const rawName = String(userName || "").trim();
  const resolved = resolveParticipantName(
    rawName,
    userData,
    remoteNameFallback,
    waitingForName,
  );
  const label = isLocal ? `${localName} (You)` : resolved;
  const isMuted = audioState !== "playable";
  const bgColor = getTileBgColor(label);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-all",
        isActiveSpeaker
          ? "border-[#8ab4f8]/40 bg-[#8ab4f8]/8"
          : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/15",
      )}
    >
      {/* Avatar with bg color */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white/15 text-[13px] font-bold text-white shadow-md"
        style={{ backgroundColor: bgColor }}
      >
        {getInitials(label)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-medium text-white">{label}</p>
          {isActiveSpeaker && (
            <div className="flex items-end gap-0.5 h-3 shrink-0">
              {[1, 2, 3].map((i) => (
                <m.div
                  key={i}
                  className="w-0.5 rounded-full bg-[#8ab4f8]"
                  animate={{ height: ["30%", "100%", "30%"] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {isLocal && <p className="text-[10px] text-[#9aa0a6] mt-0.5">You</p>}
      </div>

      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-full border shrink-0",
          isMuted
            ? "bg-[#ea4335]/15 border-[#ea4335]/30"
            : "bg-[#34a853]/15 border-[#34a853]/30",
        )}
      >
        {isMuted ? (
          <MicOff className="size-3.5 text-[#ea4335]" />
        ) : (
          <Mic className="size-3.5 text-[#34a853]" />
        )}
      </div>
    </div>
  );
}

// ─── MeetingSidebar ───────────────────────────────────────────────────────────
function MeetingSidebar({
  appointmentId,
  activePanel,
  onClose,
  localSessionId,
  displayName,
  waitingForName,
  sentMessages,
  onSendMessage,
  activeSpeakerId,
}: {
  appointmentId: string;
  activePanel: MeetPanel;
  onClose: () => void;
  localSessionId: string;
  displayName: string;
  waitingForName?: string | undefined;
  sentMessages: DailyAppMessage[];
  onSendMessage: (msg: DailyAppMessage) => void;
  activeSpeakerId: string | null;
}) {
  const { waitingParticipants, grantAccess, denyAccess } =
    useWaitingParticipants();
  const participantIds = useParticipantIds();
  const [draft, setDraft] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sentMessages]);

  const panelTitle =
    activePanel === "chat" ? "In-call messages" : "Participants";

  return (
    <div className="flex h-full flex-col bg-[#1e1f20] text-white border-l border-white/10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
        <h2 className="text-[16px] font-semibold text-white">{panelTitle}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full text-[#9aa0a6] hover:bg-white/10 transition-colors"
          aria-label="Close panel"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        {activePanel === "chat" ? (
          <>
            {/* Disclaimer */}
            <div className="mx-4 mt-4 shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] text-[#9aa0a6] text-center leading-relaxed">
              Messages are only visible to people in this call and are deleted
              when the call ends.
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 gap-y-5 min-h-0">
              {sentMessages.length === 0 && (
                <div className="flex h-full items-center justify-center pt-8">
                  <div className="text-center gap-y-2">
                    <MessageSquare className="mx-auto size-10 text-[#3c4043]" />
                    <p className="text-[13px] text-[#5f6368]">
                      No messages yet
                    </p>
                    <p className="text-[11px] text-[#3c4043]">
                      Say hello to everyone!
                    </p>
                  </div>
                </div>
              )}
              {sentMessages.map((msg) => {
                const isMe = !!msg.isLocal;
                const rawSender = String(msg.senderName || "").trim();
                const senderName = isMe
                  ? "You"
                  : rawSender && !["Participant", "Guest"].includes(rawSender)
                    ? rawSender
                    : waitingForName || "Participant";
                const bgColor = getTileBgColor(isMe ? displayName : senderName);

                return (
                  <div
                    key={`${msg.sentAt}-${msg.text}`}
                    className={cn(
                      "flex gap-2.5",
                      isMe ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    {!isMe && (
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white/15 text-[11px] font-bold text-white self-end mb-1 shadow-md"
                        style={{ backgroundColor: bgColor }}
                      >
                        {getInitials(senderName)}
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex flex-col max-w-[78%]",
                        isMe ? "items-end" : "items-start",
                      )}
                    >
                      {!isMe && (
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[11px] font-semibold text-[#e8eaed]">
                            {senderName}
                          </span>
                          <span className="text-[10px] text-[#5f6368]">
                            {formatTimestamp(msg.sentAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "px-3.5 py-2.5 text-[13px] leading-relaxed break-words",
                          isMe
                            ? "bg-[#8ab4f8] text-[#202124] rounded-2xl rounded-tr-sm font-medium"
                            : "bg-[#2d2e30] text-white rounded-2xl rounded-tl-sm border border-white/10",
                        )}
                      >
                        {msg.text}
                      </div>
                      {isMe && (
                        <span className="mt-1 px-1 text-[10px] text-[#5f6368]">
                          {formatTimestamp(msg.sentAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/10 p-4">
              <form
                action={(formData) => {
                  const text = String(formData.get("message") ?? "").trim();
                  if (!text) return;
                  onSendMessage({
                    appointmentId,
                    sentAt: nowIso(),
                    source: "healthcarefrontend",
                    text,
                    senderName: displayName,
                  });
                  setDraft("");
                }}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#2d2e30] px-4 py-1 focus-within:border-[#8ab4f8]/50 focus-within:ring-1 focus-within:ring-[#8ab4f8]/20 transition-all"
                suppressHydrationWarning
              >
                <input
                  name="message"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Send a message to everyone"
                  aria-label="Message"
                  className="flex-1 bg-transparent py-3 text-[13px] text-white outline-none placeholder:text-[#5f6368]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#8ab4f8]/25 bg-[#8ab4f8]/15 text-[#8ab4f8] hover:bg-[#8ab4f8]/25 transition disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* ── People panel ── */
          <div className="flex-1 overflow-y-auto p-4 min-h-0 gap-y-5">
            {waitingParticipants.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a6]">
                  Waiting to join · {waitingParticipants.length}
                </p>
                <div className="gap-y-2">
                  {waitingParticipants.map((p) => {
                    const rawName = String(p.name || p.user_name || "").trim();
                    const pName =
                      rawName && !["Participant", "Guest"].includes(rawName)
                        ? rawName
                        : waitingForName || "Participant";
                    const bgColor = getTileBgColor(pName);
                    return (
                      <div
                        key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-[#fbbc05]/25 bg-[#fbbc05]/8 p-3 hover:bg-[#fbbc05]/12 transition-all"
                      >
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-white/15 text-[13px] font-bold text-white shadow-md"
                          style={{ backgroundColor: bgColor }}
                        >
                          {getInitials(pName)}
                        </div>
                        <span className="flex-1 text-[13px] font-medium text-white truncate">
                          {pName}
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => denyAccess(p.id)}
                            className="rounded-lg border border-[#ea4335]/30 bg-[#ea4335]/10 px-3 py-1.5 text-[11px] font-semibold text-[#ea4335] hover:bg-[#ea4335]/20 transition"
                          >
                            Deny
                          </button>
                          <button
                            type="button"
                            onClick={() => grantAccess(p.id)}
                            className="rounded-lg border border-[#8ab4f8]/30 bg-[#8ab4f8]/10 px-3 py-1.5 text-[11px] font-semibold text-[#8ab4f8] hover:bg-[#8ab4f8]/20 transition"
                          >
                            Admit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a6]">
                In call · {participantIds.length}
              </p>
              <div className="gap-y-2">
                {participantIds.map((id) => (
                  <SidebarParticipantRow
                    key={id}
                    sessionId={id}
                    isLocal={id === localSessionId}
                    localName={displayName}
                    waitingForName={waitingForName}
                    isActiveSpeaker={id === activeSpeakerId}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EndCallModal — leave meeting vs complete & end appointment ───────────────
function EndCallModal({
  onLeave,
  appointmentId,
  isDoctor,
  small,
}: {
  onLeave: () => void;
  appointmentId: string;
  isDoctor: boolean;
  small?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const { mutateAsync: completeAppointment } = useCompleteAppointment();
  const btnSize = small ? "h-11 w-20" : "h-14 w-24";
  const iconSize = small ? "size-5" : "size-6";

  return (
    <>
      {/* Trigger button — red PhoneOff */}
      <m.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="End call options"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center rounded-full bg-[#ea4335] text-white hover:bg-[#d93025] transition-all shrink-0 focus:outline-none",
          btnSize,
        )}
      >
        <PhoneOff className={iconSize} />
      </m.button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border border-[#3c4043] bg-[#202124] p-6 text-white shadow-2xl max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-white">
              Leave call
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 gap-y-2">
            {/* Leave Meeting — no API call */}
            <button
              type="button"
              disabled={isCompleting}
              onClick={() => {
                setOpen(false);
                onLeave();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fbbc05]/15">
                <PhoneOff className="size-4 text-[#fbbc05]" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-white">
                  Leave Meeting
                </p>
                <p className="text-[11px] text-[#9aa0a6]">
                  Others can continue
                </p>
              </div>
            </button>

            {/* Complete & End Appointment — only for doctors */}
            {isDoctor && (
              <>
                <div className="border-t border-white/10" />
                <button
                  type="button"
                  disabled={isCompleting}
                  onClick={async () => {
                    setIsCompleting(true);
                    try {
                      await completeAppointment({
                        id: appointmentId,
                        data: {},
                      });
                      onLeave();
                    } catch {
                      showErrorToast(
                        "Could not mark appointment as complete. You have been removed from the call.",
                      );
                      onLeave();
                    } finally {
                      setIsCompleting(false);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white hover:bg-[#ea4335]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ea4335]/15">
                    {isCompleting ? (
                      <Loader2 className="size-4 text-[#ea4335] animate-spin" />
                    ) : (
                      <PhoneOff className="size-4 text-[#ea4335]" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-[#ea4335]">
                      Complete &amp; End Appointment
                    </p>
                    <p className="text-[11px] text-[#9aa0a6]">
                      Mark as complete &amp; close
                    </p>
                  </div>
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GridLayout({
  activeSessionId,
  secondaryIds,
  localSessionId,
  displayName,
  waitingForName,
  activeSpeakerId,
  layout = "auto",
}: {
  activeSessionId: string;
  secondaryIds: string[];
  localSessionId: string;
  displayName: string;
  waitingForName?: string | undefined;
  activeSpeakerId: string | null;
  layout?: VideoLayout | undefined;
}) {
  const total = (activeSessionId ? 1 : 0) + secondaryIds.length;
  const forceSpotlight = layout === "spotlight";
  const forceTiled = layout === "tiled";

  if (total <= 1) {
    return (
      <div className="flex-1 min-h-0 min-w-0">
        {activeSessionId ? (
          <ParticipantTile
            sessionId={activeSessionId}
            isLocal={activeSessionId === localSessionId}
            localName={displayName}
            waitingForName={waitingForName}
            isActiveSpeaker={activeSessionId === activeSpeakerId}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-[#8ab4f8]" />
          </div>
        )}
      </div>
    );
  }

  // Tiled: equal grid for everyone
  if (forceTiled) {
    const all = activeSessionId
      ? [activeSessionId, ...secondaryIds]
      : secondaryIds;
    const cols = all.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3";
    return (
      <div className={`grid flex-1 gap-1.5 sm:gap-2 min-h-0 ${cols}`}>
        {all.map((id) => (
          <ParticipantTile
            key={id}
            sessionId={id}
            isLocal={id === localSessionId}
            localName={displayName}
            waitingForName={waitingForName}
            isActiveSpeaker={id === activeSpeakerId}
          />
        ))}
      </div>
    );
  }

  // Auto 2-person: side by side on md+, stacked on mobile
  if (total === 2 && !forceSpotlight) {
    const all = activeSessionId
      ? [activeSessionId, ...secondaryIds]
      : secondaryIds;
    return (
      <div className="flex flex-col md:flex-row flex-1 gap-1.5 md:gap-3 min-h-0">
        {all.map((id) => (
          <div key={id} className="flex-1 min-h-0 min-w-0">
            <ParticipantTile
              sessionId={id}
              isLocal={id === localSessionId}
              localName={displayName}
              waitingForName={waitingForName}
              isActiveSpeaker={id === activeSpeakerId}
            />
          </div>
        ))}
      </div>
    );
  }

  // Spotlight (forced or 3+ auto): active speaker large + right strip
  return (
    <div className="flex flex-1 gap-1.5 sm:gap-3 min-h-0 overflow-hidden">
      <div className="flex-1 min-w-0 min-h-0">
        {activeSessionId && (
          <ParticipantTile
            sessionId={activeSessionId}
            isLocal={activeSessionId === localSessionId}
            localName={displayName}
            waitingForName={waitingForName}
            isActiveSpeaker={activeSessionId === activeSpeakerId}
          />
        )}
      </div>
      <div className="flex w-[90px] sm:w-[140px] lg:w-[168px] shrink-0 flex-col gap-1.5 sm:gap-2 overflow-y-auto">
        {secondaryIds.map((id) => (
          <div
            key={id}
            className="aspect-video w-full shrink-0 overflow-hidden rounded-xl"
          >
            <ParticipantTile
              sessionId={id}
              isLocal={id === localSessionId}
              localName={displayName}
              waitingForName={waitingForName}
              isActiveSpeaker={id === activeSpeakerId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DailyCallSurfaceContent ──────────────────────────────────────────────────
function DailyCallSurfaceContent({
  access,
  appointmentId,
  appointmentTitle,
  activePanel,
  viewerRole,
  onLeave,
  displayName,
  remoteNameFallback,
  userData,
  onOpenPanel,
}: DailyInAppCallProps) {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const dailyError = useDailyError();
  const participantCounts = useParticipantCounts();
  const activeSpeakerId = useActiveSpeakerId({ ignoreLocal: false });
  const localSessionId = useLocalSessionId();
  const remoteParticipantIds = useParticipantIds({
    filter: "remote",
    sort: "user_name",
  });
  const devices = useDevices();
  const screenShare = useScreenShare();

  type DailyInAppUiState = {
    joinError: string | null;
    settingsOpen: boolean;
    mobileMenuOpen: boolean;
    layout: VideoLayout;
    now: Date;
  };

  const [uiState, setUiState] = React.useState<DailyInAppUiState>({
    joinError: null,
    settingsOpen: false,
    mobileMenuOpen: false,
    layout: "auto",
    now: new Date(),
  });
  const { joinError, settingsOpen, mobileMenuOpen, layout, now } = uiState;
  const patchUiState = (patch: Partial<DailyInAppUiState>) =>
    setUiState((current) => ({ ...current, ...patch }));
  const setJoinError = (value: string | null) => patchUiState({ joinError: value });
  const setSettingsOpen = (value: boolean) => patchUiState({ settingsOpen: value });
  const setMobileMenuOpen = (value: boolean) => patchUiState({ mobileMenuOpen: value });
  const setLayout = (value: VideoLayout) => patchUiState({ layout: value });
  const setNow = (value: Date) => patchUiState({ now: value });
  const hasJoinedRef = React.useRef(false);
  const desktopSettingsOpen = settingsOpen && !activePanel;

  const [localVideoState, localAudioState] = useParticipantProperty(
    localSessionId,
    ["tracks.video.state", "tracks.audio.state"],
  );
  const isLocalVideoOn = localVideoState === "playable";
  const isLocalAudioOn = localAudioState === "playable";

  const isPatient = String(viewerRole || "")
    .toLowerCase()
    .includes("patient");
  const isDoctor = isDoctorRole(viewerRole);
  const waitingForName =
    remoteNameFallback ||
    (isPatient
      ? (userData?.doctorName as string) || "Doctor"
      : (userData?.patientName as string) || "Patient");

  const [sentMessages, setSentMessages] = React.useState<DailyAppMessage[]>([]);
  const receivedMessagesRef = React.useRef<DailyAppMessage[]>([]);
  const lastReadMessageCountRef = React.useRef(0);
  const activePanelRef = React.useRef(activePanel);

  React.useEffect(() => {
    activePanelRef.current = activePanel;
  }, [activePanel]);

  const handleAppMessage = React.useCallback((event: { data: unknown }) => {
    const payload = event.data;
    if (!payload || typeof payload !== "object") return;
    const msg = { ...(payload as DailyAppMessage), isLocal: false };
    receivedMessagesRef.current = [...receivedMessagesRef.current, msg];
    setSentMessages((prev) => [...prev, msg]);
    if (activePanelRef.current !== "chat") {
      showInfoToast(`New message from ${msg.senderName || "Participant"}`, {
        description:
          msg.text.length > 50 ? `${msg.text.slice(0, 50)}…` : msg.text,
      });
    }
  }, []);

  const sendAppMessage = useAppMessage<DailyAppMessage>({
    onAppMessage: handleAppMessage,
  });

  const handleSendMessage = React.useCallback(
    (msg: DailyAppMessage) => {
      sendAppMessage(msg);
      setSentMessages((prev) => [...prev, { ...msg, isLocal: true }]);
    },
    [sendAppMessage],
  );

  // Join room
  React.useEffect(() => {
    if (!daily || !access.meetingUrl || hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    let cancelled = false;

    const join = async () => {
      try {
        await daily.join({
          url: access.meetingUrl,
          userName: displayName,
          userData,
          showLeaveButton: false,
          showFullscreenButton: false,
          showUserNameChangeUI: false,
          customLayout: true,
          subscribeToTracksAutomatically: true,
          startVideoOff: true,
          startAudioOff: false,
          ...(access.token ? { token: access.token } : {}),
        });
      } catch (err) {
        if (!cancelled) {
          hasJoinedRef.current = false;
          setJoinError(
            err instanceof Error
              ? err.message
              : `Unable to join: ${JSON.stringify(err)}`,
          );
        }
      }
    };

    void join();
    return () => {
      cancelled = true;
      hasJoinedRef.current = false;
      try {
        void daily.leave();
      } catch {
        /* ignore */
      }
    };
  }, [access.meetingUrl, access.token, daily, displayName, userData]);

  // Clock
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const renderedState = meetingState
    ? getMeetingStateLabel(meetingState)
    : "Connecting";
  const errorMessage =
    joinError ||
    String((dailyError as { message?: unknown } | null)?.message || "");
  const isJoined = meetingState === "joined-meeting";
  const unreadCount = activePanel === "chat"
    ? 0
    : Math.max(0, receivedMessagesRef.current.length - lastReadMessageCountRef.current);

  const activeSessionId =
    activeSpeakerId || remoteParticipantIds[0] || localSessionId || "";
  const secondaryIds = Array.from(
    new Set([
      ...remoteParticipantIds
        .filter((id) => id !== activeSessionId)
        .slice(0, 5),
      ...(localSessionId ? [localSessionId] : []),
    ]),
  ).filter((id) => id !== activeSessionId);

  const hasScreenShare = screenShare.screens.length > 0;
  const isLocalSharing = screenShare.isSharingScreen;
  const clockLabel = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const sessionLabel = appointmentId.slice(-8).toUpperCase();

  const handleTogglePanel = (panel: MeetPanel) => {
    const nextPanel = activePanel === panel ? null : panel;
    if (nextPanel === "chat") {
      lastReadMessageCountRef.current = receivedMessagesRef.current.length;
    }
    onOpenPanel?.(nextPanel);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#111315] text-white">
      {/* Error banner */}
      {errorMessage && (
        <div className="absolute top-0 inset-x-0 z-50 px-4 pt-3">
          <div className="rounded-xl bg-[#ea4335]/20 border border-[#ea4335]/30 px-4 py-2.5 text-[13px] text-[#f28b82]">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Connecting */}
      {!isJoined ? (
        <VideoLoadingScreen
          message="Joining consultation"
          sub={
            meetingState === "joining-meeting"
              ? "Connecting to the secure video room…"
              : "Initialising your video session…"
          }
        />
      ) : (
        <>
          {/* ── Middle row: video + sidebar ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Video area */}
            <div className="relative flex flex-1 min-w-0 flex-col overflow-hidden">
              {/* Header overlay — title left, LIVE badge right, no overlap */}
              <div className="absolute top-0 inset-x-0 z-20 flex items-start justify-between gap-2 px-3 pt-3 md:px-4 md:pt-4 pointer-events-none">
                {/* Left: title pill */}
                <div className="flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1.5 border border-white/10 pointer-events-auto min-w-0 max-w-[60%]">
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white border border-white/20"
                    style={{
                      backgroundColor: getTileBgColor(appointmentTitle),
                    }}
                  >
                    {appointmentTitle
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase() || "V"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-white">
                      {appointmentTitle}
                    </p>
                    <p className="text-[9px] text-[#9aa0a6]">
                      {remoteParticipantIds.length > 0
                        ? `${remoteParticipantIds.length + 1} participants`
                        : "Waiting for others…"}
                    </p>
                  </div>
                </div>

                {/* Right: LIVE badge only — no overlap */}
                <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
                  {isLocalSharing && (
                    <div className="hidden md:flex items-center gap-1 rounded-full bg-[#8ab4f8]/20 border border-[#8ab4f8]/40 px-2 py-1 text-[10px] font-semibold text-[#8ab4f8]">
                      <MonitorUp className="size-3" />
                      Presenting
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider border",
                      isJoined
                        ? "bg-[#34a853]/15 text-[#34a853] border-[#34a853]/30"
                        : "bg-white/10 text-[#9aa0a6] border-white/10",
                    )}
                  >
                    {isJoined && (
                      <span className="size-1.5 rounded-full bg-[#34a853] animate-pulse shrink-0" />
                    )}
                    <span>{renderedState}</span>
                  </div>
                </div>
              </div>

              {/* Video grid */}
              <div className="flex flex-1 min-h-0 overflow-hidden p-1.5 sm:p-3 gap-1.5 sm:gap-3">
                {hasScreenShare ? (
                  <div className="flex flex-1 gap-2 sm:gap-3 min-h-0">
                    <div className="flex-1 min-w-0 min-h-0">
                      {screenShare.screens[0] && (
                        <ScreenShareTile
                          sessionId={screenShare.screens[0].session_id}
                          remoteNameFallback={waitingForName}
                          waitingForName={waitingForName}
                          isLocal={
                            screenShare.screens[0].session_id === localSessionId
                          }
                          onStopShare={() => screenShare.stopScreenShare()}
                        />
                      )}
                    </div>
                    {secondaryIds.length > 0 && (
                      <div className="flex w-[140px] sm:w-[168px] shrink-0 flex-col gap-2 overflow-y-auto">
                        {secondaryIds.map((id) => (
                          <div
                            key={id}
                            className="aspect-video w-full shrink-0 overflow-hidden rounded-xl"
                          >
                            <ParticipantTile
                              sessionId={id}
                              isLocal={id === localSessionId}
                              localName={displayName}
                              waitingForName={waitingForName}
                              isActiveSpeaker={id === activeSpeakerId}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <GridLayout
                    activeSessionId={activeSessionId}
                    secondaryIds={secondaryIds}
                    localSessionId={localSessionId}
                    displayName={displayName}
                    waitingForName={waitingForName}
                    activeSpeakerId={activeSpeakerId}
                    layout={layout}
                  />
                )}
              </div>

              {/* Waiting overlay — top-center, below header, never covers name tag */}
              {remoteParticipantIds.length === 0 && !hasScreenShare && (
                <div className="absolute top-16 inset-x-0 flex justify-center z-10 pointer-events-none px-4">
                  <div className="rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 px-4 py-3 text-center max-w-[80vw] sm:max-w-xs">
                    <p className="text-[13px] sm:text-[14px] font-medium text-white">
                      Waiting for {waitingForName}…
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#9aa0a6]">
                      You&apos;re the only one here right now.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — bottom sheet on mobile, side panel on desktop */}
            <AnimatePresence>
              {activePanel && (
                <>
                  {/* Mobile: full-screen overlay from bottom */}
                  <m.div
                    key={`overlay-${activePanel}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => onOpenPanel?.(null)}
                  />
                  <m.div
                    key={activePanel}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 32, stiffness: 320 }}
                    className="fixed bottom-0 left-0 right-0 z-50 h-[85dvh] overflow-hidden rounded-t-3xl lg:hidden"
                  >
                    <MeetingSidebar
                      appointmentId={appointmentId}
                      activePanel={activePanel}
                      onClose={() => onOpenPanel?.(null)}
                      localSessionId={localSessionId}
                      displayName={displayName}
                      waitingForName={waitingForName}
                      sentMessages={sentMessages}
                      onSendMessage={handleSendMessage}
                      activeSpeakerId={activeSpeakerId}
                    />
                  </m.div>

                  {/* Desktop: side panel */}
                  <m.div
                    key={`desktop-${activePanel}`}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 380, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className="hidden lg:block shrink-0 overflow-hidden"
                    style={{ minWidth: 0 }}
                  >
                    <div className="h-full w-[380px] overflow-hidden">
                      <MeetingSidebar
                        appointmentId={appointmentId}
                        activePanel={activePanel}
                        onClose={() => onOpenPanel?.(null)}
                        localSessionId={localSessionId}
                        displayName={displayName}
                        waitingForName={waitingForName}
                        sentMessages={sentMessages}
                        onSendMessage={handleSendMessage}
                        activeSpeakerId={activeSpeakerId}
                      />
                    </div>
                  </m.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom toolbar ── */}
          <div className="relative z-30 shrink-0 bg-[#202124] border-t border-white/10">
            {/* Mobile toolbar — shown below md (768px) */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 md:hidden">
              {/* Mic + chevron */}
              <MicGroup
                isOn={isLocalAudioOn}
                onToggle={() => daily?.setLocalAudio(!isLocalAudioOn)}
                devices={devices}
                small
              />

              {/* Camera + chevron */}
              <CameraGroup
                isOn={isLocalVideoOn}
                onToggle={() => daily?.setLocalVideo(!isLocalVideoOn)}
                devices={devices}
                small
              />

              {/* End call */}
              {onLeave && (
                <EndCallModal
                  onLeave={onLeave}
                  appointmentId={appointmentId}
                  isDoctor={isDoctor}
                  small
                />
              )}

              {/* More menu — separate state from desktop settings */}
              <Popover open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <PopoverTrigger asChild>
                <m.button
                    type="button"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    aria-label="More options"
                    className={cn(
                      "relative flex size-10 items-center justify-center rounded-full transition-all shrink-0 focus:outline-none",
                      mobileMenuOpen
                        ? "bg-[#8ab4f8]/20 text-[#8ab4f8] border-2 border-[#8ab4f8]/40"
                        : "bg-[#3c4043] text-[#e8eaed]",
                    )}
                  >
                    <MoreVertical className="size-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-[#ea4335] text-[7px] font-bold text-white border border-[#202124]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                </m.button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  sideOffset={12}
                  align="end"
                  className="w-[min(92vw,22rem)] rounded-2xl border border-[#3c4043] bg-[#202124] p-2 text-white shadow-2xl z-[200]"
                >
                  {/* Screen share */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (isLocalSharing) {
                        void screenShare.stopScreenShare();
                      } else {
                        void screenShare.startScreenShare();
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    <MonitorUp
                      className={cn(
                        "size-5 shrink-0",
                        isLocalSharing ? "text-[#8ab4f8]" : "text-[#9aa0a6]",
                      )}
                    />
                    <span>
                      {isLocalSharing ? "Stop presenting" : "Present screen"}
                    </span>
                  </button>

                  {/* People */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleTogglePanel("people");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    <Users className="size-5 shrink-0 text-[#9aa0a6]" />
                    <span className="flex-1 text-left">Participants</span>
                    {participantCounts.present > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#8ab4f8] text-[9px] font-bold text-[#202124]">
                        {participantCounts.present > 9
                          ? "9+"
                          : participantCounts.present}
                      </span>
                    )}
                  </button>

                  {/* Chat */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleTogglePanel("chat");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
                  >
                    <MessageSquare className="size-5 shrink-0 text-[#9aa0a6]" />
                    <span className="flex-1 text-left">In-call messages</span>
                    {unreadCount > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-[#ea4335] text-[9px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <div className="my-1 border-t border-white/10" />

                  {/* Layout */}
                  <p className="px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a6]">
                    Layout
                  </p>
                  {[
                    {
                      id: "auto" as VideoLayout,
                      label: "Auto",
                      icon: LayoutGrid,
                    },
                    {
                      id: "spotlight" as VideoLayout,
                      label: "Spotlight",
                      icon: Maximize2,
                    },
                    {
                      id: "tiled" as VideoLayout,
                      label: "Tiled",
                      icon: LayoutPanelLeft,
                    },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setLayout(id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors",
                        layout === id
                          ? "bg-[#8ab4f8]/15 text-[#8ab4f8]"
                          : "text-white hover:bg-white/10",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      {layout === id && (
                        <svg
                          className="size-3.5 shrink-0"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M2 7L5.5 10.5L12 3.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Desktop toolbar — shown at md (768px) and above */}
            <div className="hidden md:flex items-center justify-between gap-3 p-4 max-w-5xl mx-auto">
              {/* Left: clock + session */}
              <div className="hidden lg:flex items-center gap-3 min-w-0 flex-1">
                <span className="text-[14px] font-semibold text-white tabular-nums">
                  {clockLabel}
                </span>
                <span className="text-white/20 select-none">|</span>
                <span className="text-[12px] text-[#9aa0a6] font-mono">
                  {sessionLabel}
                </span>
              </div>

              {/* Center: media controls */}
              <div className="flex items-center justify-center gap-2 flex-1 lg:flex-none">
                <MicGroup
                  isOn={isLocalAudioOn}
                  onToggle={() => daily?.setLocalAudio(!isLocalAudioOn)}
                  devices={devices}
                />
                <CameraGroup
                  isOn={isLocalVideoOn}
                  onToggle={() => daily?.setLocalVideo(!isLocalVideoOn)}
                  devices={devices}
                />
                <ScreenShareMenu
                  isSharingScreen={isLocalSharing}
                  onStartShare={() => {
                    void screenShare.startScreenShare();
                  }}
                  onStopShare={() => {
                    void screenShare.stopScreenShare();
                  }}
                />
                <Popover open={desktopSettingsOpen} onOpenChange={setSettingsOpen}>
                  <PopoverTrigger asChild>
                    <ToolbarBtn
                      icon={MoreVertical}
                      label="More options"
                      active={desktopSettingsOpen}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    sideOffset={16}
                    align="center"
                    className="w-[min(92vw,22rem)] rounded-2xl border border-[#3c4043] bg-[#202124] p-3 text-white shadow-2xl z-[200]"
                  >
                    <div className="gap-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          handleTogglePanel("people");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        <Users className="size-5 shrink-0 text-[#9aa0a6]" />
                        <span className="flex-1 text-left">Participants</span>
                        {participantCounts.present > 0 && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-[#8ab4f8] text-[9px] font-bold text-[#202124]">
                            {participantCounts.present > 9
                              ? "9+"
                              : participantCounts.present}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsOpen(false);
                          handleTogglePanel("chat");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[14px] font-medium text-white hover:bg-white/10 transition-colors"
                      >
                        <MessageSquare className="size-5 shrink-0 text-[#9aa0a6]" />
                        <span className="flex-1 text-left">
                          In-call messages
                        </span>
                        {unreadCount > 0 && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-[#ea4335] text-[9px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </button>

                      <div className="my-1 border-t border-white/10" />

                      <p className="px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a6]">
                        Layout
                      </p>
                      {[
                        {
                          id: "auto" as VideoLayout,
                          label: "Auto",
                          icon: LayoutGrid,
                        },
                        {
                          id: "spotlight" as VideoLayout,
                          label: "Spotlight",
                          icon: Maximize2,
                        },
                        {
                          id: "tiled" as VideoLayout,
                          label: "Tiled",
                          icon: LayoutPanelLeft,
                        },
                      ].map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setLayout(id);
                            setSettingsOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors",
                            layout === id
                              ? "bg-[#8ab4f8]/15 text-[#8ab4f8]"
                              : "text-white hover:bg-white/10",
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="flex-1 text-left">{label}</span>
                          {layout === id && (
                            <svg
                              className="size-3.5 shrink-0"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M2 7L5.5 10.5L12 3.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {onLeave && (
                  <EndCallModal
                    onLeave={onLeave}
                    appointmentId={appointmentId}
                    isDoctor={isDoctor}
                  />
                )}
              </div>

              {/* Right: panel toggles */}
              <div className="flex items-center justify-end gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => handleTogglePanel("people")}
                  aria-label="Participants"
                  className={cn(
                    "relative flex size-14 items-center justify-center rounded-full transition-all",
                    activePanel === "people"
                      ? "bg-[#8ab4f8]/20 text-[#8ab4f8] border-2 border-[#8ab4f8]/40"
                      : "bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]",
                  )}
                >
                  <Users className="size-6" />
                  {participantCounts.present > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#8ab4f8] text-[9px] font-bold text-[#202124] border-2 border-[#202124]">
                      {participantCounts.present > 9
                        ? "9+"
                        : participantCounts.present}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePanel("chat")}
                  aria-label="Chat"
                  className={cn(
                    "relative flex size-14 items-center justify-center rounded-full transition-all",
                    activePanel === "chat"
                      ? "bg-[#8ab4f8]/20 text-[#8ab4f8] border-2 border-[#8ab4f8]/40"
                      : "bg-[#3c4043] text-[#e8eaed] hover:bg-[#5f6368]",
                  )}
                >
                  <MessageSquare className="size-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#ea4335] text-[9px] font-bold text-white border-2 border-[#202124]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      </div>
    </LazyMotion>
  );
}

// ─── DailyCallSurface (public export) ────────────────────────────────────────
function DailyCallSurface(props: DailyInAppCallProps) {
  const [callObject] = React.useState<DailyCall | false>(() => {
    try {
      return getOrCreateCallObject();
    } catch (err) {
      console.error("[VIDEO] Daily.createCallObject failed:", err);
      return false;
    }
  });

  React.useEffect(() => {
    if (!callObject) return;

    return () => {
      if (callObject === sharedDailyCallObject) {
        try {
          if (!callObject.isDestroyed()) {
            void callObject.leave();
            callObject.destroy();
          }
        } catch {
          /* ignore */
        }
        sharedDailyCallObject = null;
      }
    };
  }, [callObject]);

  if (callObject === false) {
    return (
      <div className="flex h-full w-full min-h-[100dvh] items-center justify-center bg-[#111315] px-6 text-center">
        <div className="rounded-2xl bg-[#ea4335]/10 border border-[#ea4335]/20 px-6 py-5 text-[14px] text-[#f28b82] max-w-sm">
          Failed to initialise the video engine. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <DailyProvider callObject={callObject}>
      <DailyAudio autoSubscribeActiveSpeaker />
      <DailyCallSurfaceContent {...props} />
    </DailyProvider>
  );
}

export { DailyCallSurface };




