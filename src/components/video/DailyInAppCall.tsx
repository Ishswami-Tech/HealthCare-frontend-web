"use client";

import React from "react";
import { Loader2, MonitorUp, MonitorX, ScreenShare, Video } from "lucide-react";
import { formatTimeInIST, nowIso } from "@/lib/utils/date-time";
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
import { showInfoToast, showErrorToast } from "@/hooks/utils/use-toast";
import { useCompleteAppointment } from "@/hooks/query/useAppointments";
import type { VideoRoomAccess } from "@/components/video/VideoAppointmentRoomWorkspace";
import { isDoctorRole } from "@/components/video/daily-in-app-call-utils";
import {
  CALL_FOCUS,
  CallChatPanel,
  CallGridStage,
  CallParticipantRow,
  CallParticipantsPanel,
  CallRoomView,
  CallSidePanel,
  CallSpotlightStage,
  CallStripStage,
  CallTile,
  LeaveCallDialog,
  PatientCallView,
  formatCallDuration,
  type CallChatMessage,
  type CallDeviceGroup,
  type CallExitReason,
  type CallStageTile,
  type MeetPanel,
  type VideoLayout,
} from "@/components/video/call";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  /**
   * The person leaves the call screen. `left` = they chose to leave and the visit stays open,
   * `completed` = the doctor completed the visit first.
   */
  onLeave?: ((reason?: CallExitReason) => void) | undefined;
  /** The call ended by itself (connection lost, removed from the room, room closed). */
  onCallEnded?: (() => void) | undefined;
  /** Doctor roles: link to the patient record, opened in a new tab so the call keeps running. */
  caseSheetHref?: string | undefined;
  /** Doctor roles: opens the prescription dialog. */
  onPrescribe?: (() => void) | undefined;
  displayName: string;
  remoteNameFallback?: string;
  userData?: Record<string, unknown>;
  onOpenPanel?: (panel: MeetPanel | null) => void;
  renderPanelContent?: (panel: MeetPanel | null) => React.ReactNode;
};

// ─── Singleton call object ────────────────────────────────────────────────────
// Shared across the meet surface so React Strict Mode remounts (dev double-invoke)
// do not destroy the instance while Daily's call-machine bundle is still loading.
// Destroying mid-load surfaces as:
//   Failed to load call object bundle ... Cannot set properties of undefined (setting 'callMachine')
let sharedDailyCallObject: DailyCall | null = null;
let sharedDailyCallRefCount = 0;

type DailyMediaKind = "audio" | "video";

/**
 * @daily-co/daily-react's camera-error handler calls `error.missingMedia.includes(...)`
 * without guarding null. Some NotFoundError paths (no mic / preferred device gone) emit
 * `missingMedia: null`, which crashes the meet page. Normalize before listeners run.
 */
function inferDailyMediaKinds(message: string): DailyMediaKind[] {
  const msg = message.toLowerCase();
  const kinds: DailyMediaKind[] = [];
  if (msg.includes("mic") || msg.includes("audio")) kinds.push("audio");
  if (msg.includes("cam") || msg.includes("video")) kinds.push("video");
  return kinds;
}

function normalizeDailyCameraErrorEvent(event: unknown): unknown {
  if (!event || typeof event !== "object") return event;

  const payload = event as {
    error?: {
      type?: string;
      msg?: string;
      missingMedia?: DailyMediaKind[] | null;
      blockedMedia?: DailyMediaKind[] | null;
      [key: string]: unknown;
    } | null;
    errorMsg?: string | { errorMsg?: string } | null;
  };

  const error = payload.error;
  if (!error || typeof error !== "object") return event;

  const needsMissing =
    error.type === "not-found" && !Array.isArray(error.missingMedia);
  const needsBlocked =
    error.type === "permissions" && !Array.isArray(error.blockedMedia);
  if (!needsMissing && !needsBlocked) return event;

  const nestedMsg =
    payload.errorMsg &&
    typeof payload.errorMsg === "object" &&
    typeof payload.errorMsg.errorMsg === "string"
      ? payload.errorMsg.errorMsg
      : "";
  const message = String(
    error.msg ||
      (typeof payload.errorMsg === "string" ? payload.errorMsg : nestedMsg) ||
      "",
  );
  const inferred = inferDailyMediaKinds(message);

  return {
    ...payload,
    error: {
      ...error,
      ...(needsMissing ? { missingMedia: inferred } : {}),
      ...(needsBlocked ? { blockedMedia: inferred } : {}),
    },
  };
}

function patchDailyCallCameraErrorEvents(call: DailyCall): DailyCall {
  const flagged = call as DailyCall & { __vkCameraErrorNormalized?: boolean };
  if (flagged.__vkCameraErrorNormalized) return call;
  flagged.__vkCameraErrorNormalized = true;

  // Daily's on/off/once are heavily overloaded; keep the patch runtime-safe and
  // avoid fighting those overloads at the assignment site.
  type AnyHandler = (event: unknown) => void;
  const handlerMap = new WeakMap<AnyHandler, AnyHandler>();

  const wrapHandler = (handler: AnyHandler): AnyHandler => {
    const existing = handlerMap.get(handler);
    if (existing) return existing;
    const wrapped: AnyHandler = (event) => {
      handler(normalizeDailyCameraErrorEvent(event));
    };
    handlerMap.set(handler, wrapped);
    return wrapped;
  };

  const callAny = call as unknown as {
    on: (event: string, handler: AnyHandler) => DailyCall;
    off: (event: string, handler: AnyHandler) => DailyCall;
    once?: (event: string, handler: AnyHandler) => DailyCall;
  };

  const originalOn = callAny.on.bind(call);
  callAny.on = (event, handler) => {
    if (event === "camera-error" && typeof handler === "function") {
      return originalOn(event, wrapHandler(handler));
    }
    return originalOn(event, handler);
  };

  const originalOff = callAny.off.bind(call);
  callAny.off = (event, handler) => {
    if (event === "camera-error" && typeof handler === "function") {
      return originalOff(event, handlerMap.get(handler) || handler);
    }
    return originalOff(event, handler);
  };

  if (typeof callAny.once === "function") {
    const originalOnce = callAny.once.bind(call);
    callAny.once = (event, handler) => {
      if (event === "camera-error" && typeof handler === "function") {
        return originalOnce(event, wrapHandler(handler));
      }
      return originalOnce(event, handler);
    };
  }

  return call;
}

function acquireCallObject(): DailyCall {
  if (!sharedDailyCallObject || sharedDailyCallObject.isDestroyed()) {
    sharedDailyCallObject = patchDailyCallCameraErrorEvents(
      Daily.createCallObject({
        showLeaveButton: false,
        showFullscreenButton: false,
        showUserNameChangeUI: false,
        customLayout: true,
        subscribeToTracksAutomatically: true,
        startVideoOff: false,
        startAudioOff: false,
        allowMultipleCallInstances: true,
      }),
    );
  }
  sharedDailyCallRefCount += 1;
  return sharedDailyCallObject;
}

function releaseCallObject(call: DailyCall): void {
  sharedDailyCallRefCount = Math.max(0, sharedDailyCallRefCount - 1);
  if (sharedDailyCallRefCount > 0) return;

  // Defer so Strict Mode's immediate remount can re-acquire before destroy runs.
  queueMicrotask(() => {
    if (sharedDailyCallRefCount > 0) return;
    if (call !== sharedDailyCallObject) return;
    try {
      if (!call.isDestroyed()) {
        void call.leave();
        call.destroy();
      }
    } catch {
      /* ignore teardown races */
    }
    if (sharedDailyCallObject === call) {
      sharedDailyCallObject = null;
    }
  });
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
  return formatTimeInIST(date);
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

// ─── Shared loading screen (used across all video states) ────────────────────
function VideoLoadingScreen({
  message = "Getting ready…",
  sub = "",
}: {
  message?: string;
  sub?: string;
}) {
  return (
    <div
      role="status"
      className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-[#0b1220] px-6 text-center text-white"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-y-4">
        <div className="relative mx-auto size-14">
          <Loader2 className="h-full w-full animate-spin text-[#a5b4fc]/40" aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="size-6 text-[#a5b4fc]" aria-hidden="true" />
          </div>
        </div>
        <div>
          <p className="text-[16px] font-semibold text-white">{message}</p>
          {sub && <p className="mt-1 text-[13px] text-[#9aa7bd]">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── ParticipantTile ──────────────────────────────────────────────────────────
function ParticipantTile({
  sessionId,
  isLocal = false,
  localName,
  remoteNameFallback,
  waitingForName,
  isActiveSpeaker = false,
  size = "stage",
  tag = "full",
}: {
  sessionId: string;
  isLocal?: boolean | undefined;
  localName?: string | undefined;
  remoteNameFallback?: string | undefined;
  waitingForName?: string | undefined;
  isActiveSpeaker?: boolean | undefined;
  size?: "stage" | "thumb" | undefined;
  tag?: "full" | "muted" | "none" | undefined;
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

  return (
    <CallTile
      name={label}
      isMuted={!audioOn}
      isActiveSpeaker={isActiveSpeaker}
      size={size}
      tag={tag}
      media={
        videoOn ? (
          <DailyVideo
            sessionId={sessionId}
            type="video"
            automirror={isLocal}
            fit="cover"
            className="h-full w-full object-cover"
          />
        ) : undefined
      }
    />
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
    <div className="relative h-full w-full overflow-hidden rounded-[18px] bg-[#0f172a]">
      <DailyVideo
        sessionId={sessionId}
        type="screenVideo"
        fit="contain"
        className="h-full w-full"
      />

      {/* You are presenting banner */}
      {isLocal && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.78)] px-8 py-6 text-center">
            <MonitorUp className="mx-auto mb-3 size-10 text-[#a5b4fc]" aria-hidden="true" />
            <p className="mb-1 text-[18px] font-bold text-white">
              You are presenting
            </p>
            <p className="mb-4 text-[13px] text-[#9aa7bd]">
              Others can see your screen
            </p>
            {onStopShare && (
              <button
                type="button"
                onClick={onStopShare}
                className={cn(
                  "mx-auto flex min-h-[44px] items-center gap-2 rounded-full bg-white px-5 text-[13px] font-bold text-[#0f172a] transition-colors hover:bg-[#e2e8f0]",
                  CALL_FOCUS,
                )}
              >
                <MonitorX className="size-4" aria-hidden="true" />
                Stop presenting
              </button>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-[14px] left-[14px] flex items-center gap-2 rounded-[10px] bg-[rgba(8,12,22,0.7)] px-2.5 py-1.5">
        <ScreenShare className="size-3.5 text-[#a5b4fc]" aria-hidden="true" />
        <span className="text-[13px] font-semibold text-white">
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

  return (
    <CallParticipantRow
      name={label}
      isLocal={isLocal}
      isMuted={isMuted}
      isActiveSpeaker={Boolean(isActiveSpeaker)}
    />
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
  variant,
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
  variant: "room" | "patient";
}) {
  const { waitingParticipants, grantAccess, denyAccess } =
    useWaitingParticipants();
  const participantIds = useParticipantIds();
  const isPatientVariant = variant === "patient";

  if (activePanel === "chat") {
    const messages: CallChatMessage[] = sentMessages.map((msg) => {
      const isMe = !!msg.isLocal;
      const rawSender = String(msg.senderName || "").trim();
      const senderName = isMe
        ? "You"
        : rawSender && !["Participant", "Guest"].includes(rawSender)
          ? rawSender
          : waitingForName || "Participant";
      return {
        id: `${msg.sentAt}-${msg.text}`,
        text: msg.text,
        senderName,
        timeLabel: formatTimestamp(msg.sentAt),
        isMine: isMe,
      };
    });

    return (
      <CallSidePanel
        title={isPatientVariant ? "Chat" : "In-call messages"}
        variant={variant}
        icon="chat"
        onClose={onClose}
      >
        <CallChatPanel
          variant={variant}
          messages={messages}
          {...(isPatientVariant
            ? {}
            : {
                notice:
                  "Messages are only visible to people in this call and are deleted when the call ends.",
              })}
          emptyDescription={
            isPatientVariant
              ? `Send a message to ${waitingForName || "your doctor"} during the call. Messages are deleted when the call ends.`
              : "Say hello to everyone."
          }
          placeholder={
            isPatientVariant ? "Type a message" : "Send a message to everyone"
          }
          onSend={(text) =>
            onSendMessage({
              appointmentId,
              sentAt: nowIso(),
              source: "healthcarefrontend",
              text,
              senderName: displayName,
            })
          }
        />
      </CallSidePanel>
    );
  }

  return (
    <CallSidePanel
      title="Participants"
      variant={variant}
      icon="people"
      onClose={onClose}
    >
      <CallParticipantsPanel
        waiting={waitingParticipants.map((p) => {
          const rawName = String(p.name || p.user_name || "").trim();
          const pName =
            rawName && !["Participant", "Guest"].includes(rawName)
              ? rawName
              : waitingForName || "Participant";
          return { id: p.id, name: pName };
        })}
        onAdmit={(id) => grantAccess(id)}
        onDeny={(id) => denyAccess(id)}
        inCallCount={participantIds.length}
      >
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
      </CallParticipantsPanel>
    </CallSidePanel>
  );
}

// ─── Stage — who is shown where (auto / spotlight / tiled) ───────────────────
function GridLayout({
  activeSessionId,
  secondaryIds,
  localSessionId,
  displayName,
  waitingForName,
  activeSpeakerId,
  layout = "auto",
  pipShape,
  hideMainName,
}: {
  activeSessionId: string;
  secondaryIds: string[];
  localSessionId: string;
  displayName: string;
  waitingForName?: string | undefined;
  activeSpeakerId: string | null;
  layout?: VideoLayout | undefined;
  /** Shape of the floating self view in a two-person call. */
  pipShape: "wide" | "tall";
  /** The screen already shows the other person's name above the stage. */
  hideMainName: boolean;
}) {
  const total = (activeSessionId ? 1 : 0) + secondaryIds.length;
  const forceSpotlight = layout === "spotlight";
  const forceTiled = layout === "tiled";
  const useTiledAutoLayout = layout === "auto" && total >= 3;

  const tile = (
    id: string,
    size: "stage" | "thumb" = "stage",
    tag: "full" | "muted" | "none" = "full",
  ) => (
    <ParticipantTile
      sessionId={id}
      isLocal={id === localSessionId}
      localName={displayName}
      waitingForName={waitingForName}
      isActiveSpeaker={id === activeSpeakerId}
      size={size}
      tag={tag}
    />
  );

  if (total <= 1) {
    return activeSessionId ? (
      tile(activeSessionId)
    ) : (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#a5b4fc]" aria-hidden="true" />
      </div>
    );
  }

  // Tiled: equal grid for everyone. Also use this automatically for
  // consultations with 3+ participants so every counterpart remains visible.
  if (forceTiled || useTiledAutoLayout) {
    const all = activeSessionId
      ? [activeSessionId, ...secondaryIds]
      : secondaryIds;
    const tiles: CallStageTile[] = all.map((id) => ({ key: id, node: tile(id) }));
    return <CallGridStage tiles={tiles} />;
  }

  // Auto 2-person: the other person fills the stage, own video floats on top.
  if (total === 2 && !forceSpotlight) {
    const all = activeSessionId
      ? [activeSessionId, ...secondaryIds]
      : secondaryIds;
    const mainId = all.find((id) => id !== localSessionId) ?? all[0] ?? "";
    const pipId = all.find((id) => id !== mainId);
    return (
      <CallSpotlightStage
        pipShape={pipShape}
        main={tile(mainId, "stage", hideMainName ? "muted" : "full")}
        pip={pipId ? tile(pipId, "thumb", pipShape === "tall" ? "none" : "full") : undefined}
      />
    );
  }

  // Spotlight remains available as an explicit choice for 2-person or
  // speaker-focused calls.
  return (
    <CallStripStage
      main={activeSessionId ? tile(activeSessionId) : null}
      strip={secondaryIds.map((id) => ({ key: id, node: tile(id, "thumb") }))}
    />
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
  onCallEnded,
  caseSheetHref,
  onPrescribe,
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
    layout: VideoLayout;
    now: Date;
  };

  const [uiState, setUiState] = React.useState<DailyInAppUiState>({
    joinError: null,
    layout: "auto",
    now: new Date(),
  });
  const { joinError, layout, now } = uiState;
  const patchUiState = (patch: Partial<DailyInAppUiState>) =>
    setUiState((current) => ({ ...current, ...patch }));
  const setJoinError = (value: string | null) => patchUiState({ joinError: value });
  const setLayout = (value: VideoLayout) => patchUiState({ layout: value });
  const setNow = (value: Date) => patchUiState({ now: value });
  const hasJoinedRef = React.useRef(false);

  const [localVideoState, localAudioState, localJoinedAt] = useParticipantProperty(
    localSessionId,
    ["tracks.video.state", "tracks.audio.state", "joined_at"],
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

  // The call ended by itself. Daily moves to "error" only for fatal problems (connection
  // lost, removed from the room, room closed) — never when this screen leaves on purpose,
  // which ends in "left-meeting". Tell the page once so it can show the right next screen.
  const wasJoinedRef = React.useRef(false);
  const endedNotifiedRef = React.useRef(false);
  const onCallEndedRef = React.useRef(onCallEnded);
  React.useEffect(() => {
    onCallEndedRef.current = onCallEnded;
  }, [onCallEnded]);
  React.useEffect(() => {
    if (meetingState === "joined-meeting") {
      wasJoinedRef.current = true;
      return;
    }
    if (meetingState === "error" && wasJoinedRef.current && !endedNotifiedRef.current) {
      endedNotifiedRef.current = true;
      onCallEndedRef.current?.();
    }
  }, [meetingState]);

  // Leave call: leaving never completes the visit; only a doctor can complete it.
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const { mutateAsync: completeAppointment } = useCompleteAppointment();

  const handleCompleteAndLeave = async () => {
    if (!onLeave) return;
    setIsCompleting(true);
    try {
      await completeAppointment({
        id: appointmentId,
        data: {},
      });
      setLeaveOpen(false);
      onLeave("completed");
    } catch {
      showErrorToast(
        "Could not mark the visit as complete. You have left the call and the visit is still open.",
      );
      setLeaveOpen(false);
      onLeave("left");
    } finally {
      setIsCompleting(false);
    }
  };

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
  const clockLabel = formatTimeInIST(now);
  const sessionLabel = appointmentId.slice(-8).toUpperCase();

  const handleTogglePanel = (panel: MeetPanel) => {
    const nextPanel = activePanel === panel ? null : panel;
    if (nextPanel === "chat") {
      lastReadMessageCountRef.current = receivedMessagesRef.current.length;
    }
    onOpenPanel?.(nextPanel);
  };

  const handleToggleMic = React.useCallback(() => {
    void (async () => {
      const enable = !isLocalAudioOn;
      if (
        enable &&
        (devices.hasMicError || devices.microphones.length === 0)
      ) {
        showErrorToast(
          "No microphone found. Check your device and browser permissions.",
          { id: "video-mic-missing" },
        );
        return;
      }
      try {
        await daily?.setLocalAudio(enable);
      } catch {
        showErrorToast(
          "Could not change the microphone. Check your device and try again.",
          { id: "video-mic-toggle" },
        );
      }
    })();
  }, [
    daily,
    devices.hasMicError,
    devices.microphones.length,
    isLocalAudioOn,
  ]);

  const handleToggleCamera = React.useCallback(() => {
    void (async () => {
      const enable = !isLocalVideoOn;
      if (enable && (devices.hasCamError || devices.cameras.length === 0)) {
        showErrorToast(
          "No camera found. Check your device and browser permissions.",
          { id: "video-cam-missing" },
        );
        return;
      }
      try {
        await daily?.setLocalVideo(enable);
      } catch {
        showErrorToast(
          "Could not change the camera. Check your device and try again.",
          { id: "video-cam-toggle" },
        );
      }
    })();
  }, [daily, devices.cameras.length, devices.hasCamError, isLocalVideoOn]);

  if (!isJoined) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0b1220] text-white">
        {/* Error banner */}
        {errorMessage && (
          <div className="absolute inset-x-0 top-0 z-50 px-4 pt-3">
            <div
              role="alert"
              className="rounded-xl border border-[#f43f5e]/40 bg-[#4c0519]/90 px-4 py-2.5 text-[13px] text-[#fecdd3]"
            >
              {errorMessage}
            </div>
          </div>
        )}
        <VideoLoadingScreen
          message="Joining consultation"
          sub={
            meetingState === "joining-meeting"
              ? "Connecting to the secure video room…"
              : "Initialising your video session…"
          }
        />
      </div>
    );
  }

  const isWaitingForOthers = remoteParticipantIds.length === 0 && !hasScreenShare;
  const joinedAtMs =
    localJoinedAt instanceof Date ? localJoinedAt.getTime() : null;
  const elapsedLabel =
    joinedAtMs === null ? "" : formatCallDuration((now.getTime() - joinedAtMs) / 1000);

  const toDeviceOptions = (
    list: Array<{ device: MediaDeviceInfo }>,
  ): CallDeviceGroup["devices"] =>
    list.map((d) => ({ id: d.device.deviceId, label: d.device.label }));
  const micDevices: CallDeviceGroup[] = [
    {
      label: "Microphone",
      devices: toDeviceOptions(devices.microphones),
      currentId: devices.currentMic?.device.deviceId || "",
      onSelect: (id) => void devices.setMicrophone(id),
    },
    {
      label: "Speaker",
      devices: toDeviceOptions(devices.speakers),
      currentId: devices.currentSpeaker?.device.deviceId || "",
      onSelect: (id) => void devices.setSpeaker(id),
    },
  ];
  const cameraDevices: CallDeviceGroup[] = [
    {
      label: "Camera",
      devices: toDeviceOptions(devices.cameras),
      currentId: devices.currentCam?.device.deviceId || "",
      onSelect: (id) => void devices.setCamera(id),
    },
  ];

  const firstScreen = screenShare.screens[0];
  const stage =
    hasScreenShare && firstScreen ? (
      <CallStripStage
        main={
          <ScreenShareTile
            sessionId={firstScreen.session_id}
            remoteNameFallback={waitingForName}
            waitingForName={waitingForName}
            isLocal={firstScreen.session_id === localSessionId}
            onStopShare={() => screenShare.stopScreenShare()}
          />
        }
        strip={secondaryIds.map((id) => ({
          key: id,
          node: (
            <ParticipantTile
              sessionId={id}
              isLocal={id === localSessionId}
              localName={displayName}
              waitingForName={waitingForName}
              isActiveSpeaker={id === activeSpeakerId}
              size="thumb"
            />
          ),
        }))}
      />
    ) : (
      <GridLayout
        activeSessionId={activeSessionId}
        secondaryIds={secondaryIds}
        localSessionId={localSessionId}
        displayName={displayName}
        waitingForName={waitingForName}
        activeSpeakerId={activeSpeakerId}
        layout={layout}
        pipShape={isPatient ? "tall" : "wide"}
        hideMainName={isPatient}
      />
    );

  // Several tiles side by side: keep them clear of the title and the action buttons.
  const stageTileCount = (activeSessionId ? 1 : 0) + secondaryIds.length;
  const isSplitStage =
    hasScreenShare ||
    (stageTileCount >= 2 && (layout !== "auto" || stageTileCount >= 3));

  const panelContent = activePanel ? (
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
      variant={isPatient ? "patient" : "room"}
    />
  ) : null;

  const sharedControls = {
    stage,
    panel: activePanel ?? null,
    panelContent,
    onTogglePanel: handleTogglePanel,
    onClosePanel: () => onOpenPanel?.(null),
    micOn: isLocalAudioOn,
    cameraOn: isLocalVideoOn,
    onToggleMic: handleToggleMic,
    onToggleCamera: handleToggleCamera,
    isSharingScreen: isLocalSharing,
    onStartShare: () => {
      void screenShare.startScreenShare();
    },
    onStopShare: () => {
      void screenShare.stopScreenShare();
    },
    layout,
    onLayoutChange: setLayout,
    participantCount: participantCounts.present,
    unreadCount,
    errorMessage: errorMessage || null,
    fullBleed: true,
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0b1220] text-white lg:p-5">
      {isPatient ? (
        <PatientCallView
          {...sharedControls}
          title={waitingForName}
          isLive={!isWaitingForOthers}
          statusLabel={
            isWaitingForOthers
              ? `Waiting for ${waitingForName} to join`
              : [elapsedLabel, "Secure video call"].filter(Boolean).join(" · ")
          }
          deviceGroups={[...micDevices, ...cameraDevices]}
          {...(onLeave ? { onLeave: () => onLeave("left") } : {})}
        />
      ) : (
        <CallRoomView
          {...sharedControls}
          title={appointmentTitle}
          subtitle={
            remoteParticipantIds.length > 0
              ? `${remoteParticipantIds.length + 1} participants`
              : "Waiting for others…"
          }
          stateLabel={renderedState}
          isLive={isJoined}
          stageInsetTop={isSplitStage}
          isPresenting={isLocalSharing}
          stageNotice={
            isWaitingForOthers
              ? {
                  title: `Waiting for ${waitingForName}…`,
                  description: "You're the only one here right now.",
                }
              : null
          }
          {...(isDoctor && caseSheetHref ? { caseSheetHref } : {})}
          {...(isDoctor && onPrescribe ? { onPrescribe } : {})}
          clockLabel={clockLabel}
          sessionLabel={sessionLabel}
          micDevices={micDevices}
          cameraDevices={cameraDevices}
          {...(onLeave ? { onLeave: () => setLeaveOpen(true) } : {})}
        />
      )}

      {onLeave && !isPatient ? (
        <LeaveCallDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          canComplete={isDoctor}
          isCompleting={isCompleting}
          leaveHint={isDoctor ? "The visit stays open" : "Others can continue"}
          onLeave={() => {
            setLeaveOpen(false);
            onLeave("left");
          }}
          onComplete={() => void handleCompleteAndLeave()}
        />
      ) : null}
    </div>
  );
}

// ─── DailyCallSurface (public export) ────────────────────────────────────────
function DailyCallSurface(props: DailyInAppCallProps) {
  const [callObject, setCallObject] = React.useState<DailyCall | false | null>(
    null,
  );

  React.useEffect(() => {
    try {
      const call = acquireCallObject();
      setCallObject(call);
      return () => {
        releaseCallObject(call);
      };
    } catch (err) {
      console.error("[VIDEO] Daily.createCallObject failed:", err);
      setCallObject(false);
      return undefined;
    }
  }, []);

  if (callObject === null) {
    return (
      <div
        role="status"
        className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-[#0b1220] px-6 text-center text-white"
      >
        <div className="flex w-full max-w-xs flex-col items-center gap-y-4">
          <Loader2 className="size-8 animate-spin text-[#a5b4fc]" aria-hidden />
          <p className="text-[16px] font-semibold text-white">
            Loading video engine…
          </p>
        </div>
      </div>
    );
  }

  if (callObject === false) {
    return (
      <div className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-[#0b1220] px-6 text-center">
        <div
          role="alert"
          className="max-w-sm rounded-2xl border border-[#f43f5e]/40 bg-[#4c0519]/60 px-6 py-5 text-[14px] text-[#fecdd3]"
        >
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
