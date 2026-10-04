"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { Check, Loader2, Mic, MicOff, Minus, Shield, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Divider, InitialsAvatar, Note, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { formatDateInIST, formatISODateInIST, formatTimeInIST } from "@/lib/utils/date-time";
import { VideoStageShell } from "./VideoStageShell";

export type LobbyDevice = { deviceId: string; label: string };

export type VideoLobbyViewProps = {
  /** `patient` = the waiting room; `staff` = the doctor's "Ready to join" lobby. */
  variant: "patient" | "staff";
  portalLabel?: string;
  backLabel: string;
  onBack: () => void;

  // ── camera preview ──
  videoRef: Ref<HTMLVideoElement>;
  /** A still picture for the preview (design previews only; the real page shows the live camera). */
  posterUrl?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isMirrored: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  audioDevices: LobbyDevice[];
  videoDevices: LobbyDevice[];
  selectedAudioDeviceId: string;
  selectedVideoDeviceId: string;
  onAudioDeviceChange: (deviceId: string) => void;
  onVideoDeviceChange: (deviceId: string) => void;

  // ── the visit ──
  doctorName: string;
  doctorPhotoUrl?: string;
  /** "Dr. A (doctor) • B (patient)". */
  meetingWithLabel: string;
  /** Appointment status code (CONFIRMED, IN_PROGRESS, …). */
  statusCode: string;
  /** The doctor has started the visit. */
  visitInProgress: boolean;
  /** Start of the slot (ISO), when known. */
  startsAt?: string | null;
  scheduledLabel: string;
  sessionLabel: string;
  joinWindowText: string;

  // ── joining ──
  /** "Ready to join", "Waiting for your visit", "Payment required", … */
  stateLabel: string;
  stateMessage: string;
  /** Joining is not possible right now (too early, payment missing, visit closed). */
  blocked: boolean;
  joinDisabled: boolean;
  isJoining: boolean;
  onJoin: () => void;
  /** Meeting link actions for providers that open outside the app. */
  onCopyLink?: () => void;
  /** Shown when the visit is already completed. */
  summaryHref?: string;
  /** Development-only line (session id, meeting link). */
  devInfo?: string;
};

const DEFAULT_MIC = "default-mic";
const DEFAULT_CAMERA = "default-camera";

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** The browser's own answer to "is there a network connection". */
function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}

/** A slow clock so "in 4 min" stays true while the page is open. */
function useNow(stepMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), stepMs);
    return () => window.clearInterval(id);
  }, [stepMs]);
  return now;
}

/** "Starts at 10:00 am · in 4 min" for the waiting room heading. */
function startsLine(startsAt: string | null | undefined, now: number): string {
  if (!startsAt) return "";
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return "";
  const time = formatTimeInIST(start);
  const sameDay = formatISODateInIST(start) === formatISODateInIST(new Date(now));
  const day = formatDateInIST(start, { weekday: "short", day: "numeric", month: "short" });
  const minutes = Math.round((start.getTime() - now) / 60_000);
  if (minutes <= 0) return sameDay ? `Scheduled for ${time} today` : `Scheduled for ${day}, ${time}`;
  if (minutes < 60) return `Starts at ${time} · in ${minutes} min`;
  if (sameDay) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `Starts at ${time} · in ${hours} h${rest ? ` ${rest} min` : ""}`;
  }
  return `Starts ${day}, ${time}`;
}

function deviceLabel(devices: LobbyDevice[], id: string, fallback: string): string {
  const index = devices.findIndex((device) => device.deviceId === id);
  if (index < 0) return fallback;
  return devices[index]?.label || `${fallback} ${index + 1}`;
}

// ── shared pieces ───────────────────────────────────────────────────────────

function PreviewVideo({
  videoRef,
  posterUrl,
  isVideoEnabled,
  isMirrored,
}: Pick<VideoLobbyViewProps, "videoRef" | "posterUrl" | "isVideoEnabled" | "isMirrored">) {
  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        poster={posterUrl}
        aria-label="Camera preview"
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          isMirrored && "-scale-x-100",
          isVideoEnabled ? "opacity-100" : "opacity-0",
        )}
      />
      {!isVideoEnabled ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
          <span className="flex size-20 items-center justify-center rounded-full bg-white/10">
            <VideoOff className="size-9" strokeWidth={2} aria-hidden="true" />
          </span>
          <p className="m-0 text-sm font-semibold">Camera is off</p>
        </div>
      ) : null}
    </>
  );
}

function MediaToggle({
  kind,
  on,
  onClick,
  look,
}: {
  kind: "mic" | "camera";
  on: boolean;
  onClick: () => void;
  look: "light" | "dark";
}) {
  const Icon = kind === "mic" ? (on ? Mic : MicOff) : on ? Video : VideoOff;
  const label =
    kind === "mic" ? (on ? "Mute microphone" : "Unmute microphone") : on ? "Turn off camera" : "Turn on camera";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-white/70",
        look === "light"
          ? "size-[52px]"
          : "size-[54px] shadow-[0_8px_18px_rgba(0,0,0,0.3)]",
        on
          ? look === "light"
            ? "bg-white/92 text-[#0f1b2d] hover:bg-white"
            : "bg-[rgba(15,23,42,0.72)] text-white hover:bg-[rgba(15,23,42,0.9)]"
          : "bg-[#0f1b2d] text-white ring-2 ring-white/70 hover:bg-[#1e293b]",
      )}
    >
      <Icon className="size-[22px]" strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

function DeviceSelect({
  kind,
  devices,
  value,
  onChange,
  plain = false,
}: {
  kind: "mic" | "camera";
  devices: LobbyDevice[];
  value: string;
  onChange: (deviceId: string) => void;
  /** Text-only trigger for the waiting room's device rows. */
  plain?: boolean;
}) {
  const Icon = kind === "mic" ? Mic : Video;
  const name = kind === "mic" ? "Microphone" : "Camera";
  const fallbackValue = kind === "mic" ? DEFAULT_MIC : DEFAULT_CAMERA;
  const fallbackLabel = kind === "mic" ? "Default microphone" : "Default camera";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={name}
        className={cn(
          "min-w-0 overflow-hidden",
          plain
            ? "h-auto max-w-[190px] gap-1 rounded-md border-0 bg-transparent p-0 text-[13px] text-ink-muted shadow-none data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent"
            : "w-full gap-2.5 border-line px-3.5 text-sm text-ink",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          {plain ? null : <Icon className="size-4 shrink-0 text-video" strokeWidth={2.2} aria-hidden="true" />}
          <span className="min-w-0 flex-1 truncate text-left">
            <SelectValue placeholder={fallbackLabel} />
          </span>
        </span>
      </SelectTrigger>
      <SelectContent position="popper" className="rounded-xl">
        {devices.length === 0 ? (
          <SelectItem value={fallbackValue}>{fallbackLabel}</SelectItem>
        ) : (
          devices.map((device, index) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `${name} ${index + 1}`}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

function BlockedNote({ label, message }: { label: string; message: string }) {
  return (
    <Note tone="amber" className="items-start">
      <span className="block font-bold">{label}</span>
      <span className="block">{message}</span>
    </Note>
  );
}

function JoinActions({
  props,
  joinLabel,
  joinClassName,
  children,
}: {
  props: VideoLobbyViewProps;
  joinLabel: string;
  joinClassName?: string;
  children?: ReactNode;
}) {
  const { blocked, joinDisabled, isJoining, onJoin, onCopyLink, summaryHref } = props;
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      {!blocked ? (
        <Button
          variant="action"
          size="xl"
          className={cn("w-full", joinClassName)}
          onClick={onJoin}
          disabled={joinDisabled}
          aria-busy={isJoining}
        >
          {isJoining ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Joining…
            </>
          ) : (
            <>
              <Video className="size-4" strokeWidth={2.4} aria-hidden="true" />
              {joinLabel}
            </>
          )}
        </Button>
      ) : null}
      {blocked && summaryHref ? (
        <Button asChild size="xl" className="w-full">
          <Link href={summaryHref}>See visit summary</Link>
        </Button>
      ) : null}
      {children}
      {!blocked && onCopyLink ? (
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" size="md" onClick={onCopyLink}>
            Copy link
          </Button>
          <Button variant="outline" size="md" onClick={onJoin} disabled={isJoining}>
            Open meeting
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function SecureLine({ sessionLabel, className }: { sessionLabel: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.8px] text-brand",
        className,
      )}
    >
      <Shield className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      Secure
      <span className="font-semibold text-ink-muted">Session: {sessionLabel}</span>
    </span>
  );
}

// ── patient: waiting room ───────────────────────────────────────────────────

function CheckRow({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-5 items-center gap-2.5 text-sm text-ink">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full",
          ok
            ? "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300"
            : "bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-300",
        )}
        aria-hidden="true"
      >
        {ok ? <Check className="size-3" strokeWidth={3} /> : <Minus className="size-3" strokeWidth={3} />}
      </span>
      <span className="flex-1">{label}</span>
      <span className="flex min-w-0 items-center justify-end text-[13px] text-ink-muted">{children}</span>
    </div>
  );
}

function PatientLobby(props: VideoLobbyViewProps) {
  const online = useOnline();
  const now = useNow(30_000);
  const heading = startsLine(props.startsAt, now) || props.scheduledLabel;
  return (
    <>
      <div className="flex min-w-0 flex-col">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.4px] text-ink">Waiting Room</h1>
        {heading ? (
          <p className="m-0 mt-0.5 text-sm text-ink-muted" suppressHydrationWarning>
            {heading}
          </p>
        ) : null}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative h-[300px] overflow-hidden rounded-[24px] bg-[#1e293b] shadow-[0_10px_24px_rgba(15,27,45,0.12)] sm:h-[380px] lg:h-[430px]">
          <PreviewVideo
            videoRef={props.videoRef}
            posterUrl={props.posterUrl}
            isVideoEnabled={props.isVideoEnabled}
            isMirrored={props.isMirrored}
          />
          <span className="absolute left-4 top-4 rounded-[10px] bg-[rgba(15,27,45,0.7)] px-2.5 py-1.5 text-xs font-bold text-white">
            You · Preview
          </span>
          <div className="absolute inset-x-0 bottom-5 flex justify-center gap-3.5">
            <MediaToggle kind="mic" on={props.isAudioEnabled} onClick={props.onToggleAudio} look="light" />
            <MediaToggle kind="camera" on={props.isVideoEnabled} onClick={props.onToggleVideo} look="light" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface>
            <div className="flex items-center gap-3.5">
              <span className="relative flex shrink-0">
                {props.doctorPhotoUrl ? (
                  <img
                    src={props.doctorPhotoUrl}
                    alt=""
                    className="size-14 rounded-full bg-[#d1fae5] object-cover object-top"
                  />
                ) : (
                  <InitialsAvatar name={props.doctorName} size={56} />
                )}
                {props.visitInProgress ? (
                  <span
                    className="absolute bottom-0.5 right-0.5 size-3 rounded-full border-2 border-card bg-[#10b981]"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-bold text-ink">{props.doctorName}</span>
                <span className="text-[13px] font-semibold text-brand">
                  {props.visitInProgress ? "In the visit · waiting for you" : "Will join shortly"}
                </span>
              </div>
            </div>
          </Surface>

          <Surface>
            <h2 className="m-0 text-base font-bold text-ink">Device check</h2>
            <CheckRow ok={props.isVideoEnabled} label="Camera">
              {props.isVideoEnabled ? (
                <DeviceSelect
                  kind="camera"
                  plain
                  devices={props.videoDevices}
                  value={props.selectedVideoDeviceId}
                  onChange={props.onVideoDeviceChange}
                />
              ) : (
                "Off"
              )}
            </CheckRow>
            <CheckRow ok={props.isAudioEnabled} label="Microphone">
              {props.isAudioEnabled ? (
                <DeviceSelect
                  kind="mic"
                  plain
                  devices={props.audioDevices}
                  value={props.selectedAudioDeviceId}
                  onChange={props.onAudioDeviceChange}
                />
              ) : (
                "Muted"
              )}
            </CheckRow>
            <CheckRow ok={online} label="Connection">
              <span suppressHydrationWarning>{online ? "Online" : "Offline"}</span>
            </CheckRow>
          </Surface>

          {props.blocked ? <BlockedNote label={props.stateLabel} message={props.stateMessage} /> : null}

          <JoinActions props={props} joinLabel="Join Now" joinClassName="h-[54px]" />

          <p className="m-0 flex items-start gap-2 text-xs leading-normal text-ink-muted">
            <Shield className="mt-0.5 size-3.5 shrink-0 text-brand" strokeWidth={2.4} aria-hidden="true" />
            <span>
              {props.joinWindowText} Secure visit · Session {props.sessionLabel}
            </span>
          </p>
          {props.devInfo ? <p className="m-0 truncate font-mono text-[11px] text-ink-muted">{props.devInfo}</p> : null}
        </div>
      </div>
    </>
  );
}

// ── doctor and staff: "Ready to join" ───────────────────────────────────────

function StaffLobby(props: VideoLobbyViewProps) {
  const micLabel = deviceLabel(props.audioDevices, props.selectedAudioDeviceId, "Microphone");
  const cameraLabel = deviceLabel(props.videoDevices, props.selectedVideoDeviceId, "Camera");
  return (
    <>
      <div className="flex min-w-0 flex-col">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.4px] text-ink">Video Consultation</h1>
        <p className="m-0 mt-0.5 text-sm text-ink-muted">Check your camera and microphone, then join the visit.</p>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Surface className="p-4">
          <div className="relative h-[260px] overflow-hidden rounded-[20px] bg-[radial-gradient(420px_300px_at_50%_40%,#2a3757_0%,#141c30_75%)] sm:h-[340px] lg:h-[372px]">
            <PreviewVideo
              videoRef={props.videoRef}
              posterUrl={props.posterUrl}
              isVideoEnabled={props.isVideoEnabled}
              isMirrored={props.isMirrored}
            />
            <span className="absolute left-3.5 top-3.5 rounded-[9px] bg-[rgba(8,12,22,0.66)] px-2.5 py-[5px] text-xs font-semibold text-white">
              Camera preview
            </span>
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-[18px] bg-gradient-to-b from-black/0 to-black/60 pb-5 pt-[60px]">
              <MediaToggle kind="mic" on={props.isAudioEnabled} onClick={props.onToggleAudio} look="dark" />
              <MediaToggle kind="camera" on={props.isVideoEnabled} onClick={props.onToggleVideo} look="dark" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-bold text-ink-soft">Microphone</span>
              <DeviceSelect
                kind="mic"
                devices={props.audioDevices}
                value={props.selectedAudioDeviceId}
                onChange={props.onAudioDeviceChange}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-bold text-ink-soft">Camera</span>
              <DeviceSelect
                kind="camera"
                devices={props.videoDevices}
                value={props.selectedVideoDeviceId}
                onChange={props.onVideoDeviceChange}
              />
            </div>
          </div>
          <span className="sr-only" aria-live="polite">
            {props.isAudioEnabled ? `Microphone on: ${micLabel}.` : "Microphone muted."}{" "}
            {props.isVideoEnabled ? `Camera on: ${cameraLabel}.` : "Camera off."}
          </span>
        </Surface>

        <Surface className="gap-[18px] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="video">Video call</Pill>
            {props.statusCode ? (
              <Pill tone={statusTone(props.statusCode)} dot>
                {statusLabel(props.statusCode)}
              </Pill>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-[30px] font-extrabold leading-tight tracking-[-0.6px] text-ink">
              {props.stateLabel}
            </h2>
            <p className="m-0 text-sm leading-normal text-ink-muted">
              Meeting with <b className="font-bold text-ink">{props.meetingWithLabel}</b>
            </p>
          </div>
          <Note tone="green" icon={Shield}>
            {props.joinWindowText}
          </Note>
          {props.blocked ? <BlockedNote label={props.stateLabel} message={props.stateMessage} /> : null}
          <JoinActions props={props} joinLabel="Join now">
            <Button variant="outline" size="xl" className="w-full" onClick={props.onBack}>
              Return
            </Button>
          </JoinActions>
          <Divider />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 text-sm font-medium text-ink">
              <span className="text-[13px] text-ink-muted">Scheduled</span>
              <span>{props.scheduledLabel}</span>
            </div>
            <SecureLine sessionLabel={props.sessionLabel} />
            {props.devInfo ? (
              <p className="m-0 truncate font-mono text-[11px] text-ink-muted">{props.devInfo}</p>
            ) : null}
          </div>
        </Surface>
      </div>
    </>
  );
}

/** The page a person sees before joining a video visit: camera check on the left, the visit and Join on the right. */
export function VideoLobbyView(props: VideoLobbyViewProps) {
  return (
    <VideoStageShell portalLabel={props.portalLabel} backLabel={props.backLabel} onBack={props.onBack}>
      {props.variant === "patient" ? <PatientLobby {...props} /> : <StaffLobby {...props} />}
    </VideoStageShell>
  );
}
