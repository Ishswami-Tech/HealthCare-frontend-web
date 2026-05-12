"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, MicOff, Video, VideoOff, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppointment } from "@/hooks/query/useAppointments";
import { useVideoAppointment } from "@/hooks/query/useVideoAppointments";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatDateTimeInIST, formatTimeInIST, nowIso } from "@/lib/utils/date-time";
import {
  getAppointmentDoctorName,
  getAppointmentPatientName,
  getAppointmentViewState,
  getVideoSessionDecision,
} from "@/lib/utils/appointmentUtils";
import { getVideoSessionExitRoute } from "@/lib/utils/video-session-route";
import { generateVideoToken } from "@/lib/actions/video.server";
import { VideoAppointmentRoomWorkspace, type VideoRoomAccess } from "@/components/video/VideoAppointmentRoomWorkspace";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";

const MEET_MEDIA_BUTTON_ON =
  "bg-dark-gray text-white border border-dark-gray shadow-sm hover:bg-[#4a4d51] hover:border-[#4a4d51] dark:bg-dark-gray dark:text-white dark:border-[#5f6368] dark:hover:bg-[#4a4d51]";
const MEET_MEDIA_BUTTON_OFF =
  "bg-[#ea4335] text-white border border-[#ea4335] shadow-sm hover:bg-[#d93025] hover:border-[#d93025]";
const MEET_JOIN_BUTTON =
  "bg-[#1a73e8] text-white shadow-sm hover:bg-[#1558b0] dark:bg-[#8ab4f8] dark:text-[#202124] dark:hover:bg-[#aecbfa]";
const MEET_SECONDARY_BUTTON =
  "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[#5f6368] dark:bg-transparent dark:text-white dark:hover:bg-dark-gray";
const MEET_STATUS_BADGE =
  "rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200";
const MEET_INFO_CARD =
  "rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-dark-gray dark:bg-meet-black/90";
const VIDEO_ACTIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

type VideoAppointmentMeetSessionProps = {
  appointmentId: string;
  viewerRole?: string;
  onBack?: () => void;
};

function normalizeAppointment(
  appointment: any,
  fallbackId: string
): VideoAppointment | null {
  const resolvedAppointmentId = String(
    appointment?.appointmentId || fallbackId || appointment?.id || ""
  );

  if (!resolvedAppointmentId) return null;

  const consultationSessionId = String(appointment?.id || "");
  const startTime =
    appointment?.startTime ||
    appointment?.appointmentDate ||
    appointment?.scheduledFor ||
    appointment?.createdAt ||
    nowIso();

  const endTime =
    appointment?.endTime ||
    appointment?.scheduledEndTime ||
    new Date(new Date(startTime).getTime() + VIDEO_ACTIVE_WINDOW_MS).toISOString();

  return {
    id: resolvedAppointmentId,
    appointmentId: resolvedAppointmentId,
    roomName:
      appointment?.roomName ||
      appointment?.doctorName ||
      `Room ${resolvedAppointmentId}`,
    doctorId:
      appointment?.doctorId ||
      appointment?.doctor?.id ||
      appointment?.doctor?.userId ||
      "",
    patientId:
      appointment?.patientId ||
      appointment?.patient?.id ||
      appointment?.patient?.userId ||
      "",
    startTime,
    endTime,
    status: String(appointment?.status || "scheduled")
      .toLowerCase()
      .replace(/_/g, "-") as VideoAppointment["status"],
    paymentCompleted: getAppointmentViewState(appointment).paymentCompleted,
    sessionId:
      appointment?.sessionId ||
      (consultationSessionId && consultationSessionId !== resolvedAppointmentId
        ? consultationSessionId
        : undefined),
    recordingUrl: appointment?.recordingUrl,
    notes: appointment?.notes,
    treatmentType: appointment?.treatmentType,
    createdAt: appointment?.createdAt || startTime,
    updatedAt: appointment?.updatedAt || startTime,
  };
}

function isMergeableValue(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function resolveVideoTokenRole(role?: string | null): "patient" | "doctor" | "receptionist" | "clinic_admin" {
  switch (String(role || "").trim().toUpperCase()) {
    case "DOCTOR":
    case "ASSISTANT_DOCTOR":
    case "THERAPIST":
    case "COUNSELOR":
      return "doctor";
    case "RECEPTIONIST":
    case "NURSE":
      return "receptionist";
    case "CLINIC_ADMIN":
    case "CLINIC_LOCATION_HEAD":
    case "SUPER_ADMIN":
      return "clinic_admin";
    default:
      return "patient";
  }
}

function resolveVideoProvider(
  accessProvider?: string | null,
  meetingUrl?: string | null
): VideoRoomAccess["provider"] {
  const normalized = String(accessProvider || "").trim().toLowerCase();
  if (normalized === "cloudflare" || normalized === "daily" || normalized === "google-meet") {
    return normalized;
  }

  const url = String(meetingUrl || "").trim().toLowerCase();
  if (url.includes("meet.google.com")) return "google-meet";
  if (url.includes("daily.co")) return "daily";
  return "cloudflare";
}

function formatProviderLabel(provider: VideoRoomAccess["provider"]) {
  switch (provider) {
    case "cloudflare":
      return "Cloudflare Realtime";
    case "daily":
      return "Daily";
    case "google-meet":
      return "Google Meet";
    default:
      return "Video";
  }
}

export function VideoAppointmentMeetSession({
  appointmentId,
  viewerRole,
  onBack,
}: VideoAppointmentMeetSessionProps) {
  const router = useRouter();
  const { session } = useAuth();
  const resolvedAppointmentId = appointmentId.trim();
  const { data: appointmentQuery, isPending, error } =
    useVideoAppointment(resolvedAppointmentId);
  const { data: appointmentRecordQuery } = useAppointment(resolvedAppointmentId);
  const [isRequesting, setIsRequesting] = React.useState(true);
  const [permissionError, setPermissionError] = React.useState<string | null>(null);
  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = React.useState("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = React.useState("");
  const [isAudioEnabled, setIsAudioEnabled] = React.useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = React.useState(true);
  const [isMirrored, setIsMirrored] = React.useState(true);
  const [isJoiningRoom, setIsJoiningRoom] = React.useState(false);
  const [joinedAccess, setJoinedAccess] = React.useState<VideoRoomAccess | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const previewHandedOffRef = React.useRef(false);
  const appointmentRecordSource = React.useMemo(
    () =>
      (appointmentRecordQuery as any)?.appointment ||
      (appointmentRecordQuery as any)?.data ||
      appointmentRecordQuery ||
      null,
    [appointmentRecordQuery]
  );
  const appointmentConsultationSource = React.useMemo(
    () => (appointmentQuery as any)?.appointment || (appointmentQuery as any)?.data || null,
    [appointmentQuery]
  );
  const appointmentDetailsSource = React.useMemo(() => {
    if (appointmentRecordSource && appointmentConsultationSource) {
      const merged: Record<string, unknown> = { ...appointmentConsultationSource };

      for (const [key, value] of Object.entries(appointmentRecordSource as Record<string, unknown>)) {
        if (isMergeableValue(value)) {
          merged[key] = value;
        }
      }

      return merged;
    }

    if (appointmentRecordSource) {
      return {
        ...appointmentRecordSource,
      };
    }

    return appointmentConsultationSource || appointmentRecordSource;
  }, [appointmentConsultationSource, appointmentRecordSource]);
  const appointment = React.useMemo(
    () =>
      appointmentDetailsSource
        ? normalizeAppointment(appointmentDetailsSource, resolvedAppointmentId)
        : null,
    [appointmentDetailsSource, resolvedAppointmentId]
  );
  const videoSessionDecision = React.useMemo(
    () => getVideoSessionDecision(appointmentDetailsSource || appointment),
    [appointment, appointmentDetailsSource]
  );
  const meetingUrl = React.useMemo(() => {
    const raw = (appointmentDetailsSource as { meetingUrl?: unknown } | null | undefined)?.meetingUrl;
    return typeof raw === "string" ? raw.trim() : "";
  }, [appointmentDetailsSource]);
  const appointmentDoctorName = getAppointmentDoctorName(appointmentDetailsSource);
  const appointmentPatientName = getAppointmentPatientName(appointmentDetailsSource);
  const appointmentDateValue =
    appointmentDetailsSource?.startTime ||
    appointmentDetailsSource?.appointmentDate ||
    appointmentDetailsSource?.scheduledFor ||
    appointmentDetailsSource?.date ||
    appointmentDetailsSource?.createdAt ||
    "";
  const appointmentTimeValue =
    appointmentDetailsSource?.time ||
    appointmentDetailsSource?.startTime ||
    appointmentDetailsSource?.scheduledTime ||
    "";
  const appointmentTimeSlotLabel = appointmentDateValue
    ? formatDateTimeInIST(appointmentDateValue)
    : appointmentTimeValue
      ? formatTimeInIST(appointmentTimeValue)
      : "TBD";
  const appointmentSessionLabel = resolvedAppointmentId
    ? resolvedAppointmentId.slice(-8).toUpperCase()
    : "TBD";
  const appointmentProvider = String(
    (appointmentDetailsSource as { provider?: unknown } | null | undefined)?.provider || ""
  )
    .trim()
    .toLowerCase();
  const isDailyProvider = resolveVideoProvider(
    appointmentProvider || null,
    meetingUrl
  ) === "daily";
  const meetingProviderLabel =
    isDailyProvider ? "Daily" : appointmentProvider || "backend video api";
  const meetingUrlLabel =
    isDailyProvider
      ? "In-app room available"
      : meetingUrl.length > 0
        ? meetingUrl.length > 64
          ? `${meetingUrl.slice(0, 61)}...`
          : meetingUrl
        : "Waiting for the backend to generate a meeting link";
  const appointmentDoctorLabel = appointmentDoctorName || "Doctor assigned";
  const appointmentPatientLabel = appointmentPatientName || "Patient TBD";
  const viewerRoleNormalized = String(viewerRole || "").trim().toUpperCase();
  const exitRoute = getVideoSessionExitRoute(viewerRoleNormalized);
  const meetingWithLabel =
    viewerRoleNormalized === "PATIENT"
      ? appointmentDoctorLabel
      : viewerRoleNormalized === "DOCTOR" || viewerRoleNormalized === "ASSISTANT_DOCTOR"
        ? appointmentPatientLabel
        : appointmentDoctorLabel !== "Doctor TBD"
          ? appointmentDoctorLabel
          : appointmentPatientLabel !== "Patient TBD"
            ? appointmentPatientLabel
            : viewerRoleNormalized === "PATIENT"
              ? "Doctor"
              : viewerRoleNormalized === "DOCTOR" || viewerRoleNormalized === "ASSISTANT_DOCTOR"
                ? "Patient"
                : "Video appointment";
  const blockedReason = videoSessionDecision.blockedReason || "";
  const sessionStateLabel = React.useMemo(() => {
    const normalized = blockedReason.toLowerCase();
    if (normalized.includes("join opens")) {
      return "Waiting for your visit";
    }
    if (normalized.includes("payment is required")) {
      return "Payment required";
    }
    if (normalized.includes("cancelled") || normalized.includes("completed") || normalized.includes("no-show")) {
      return "This session is closed";
    }
    return "Session unavailable";
  }, [blockedReason]);
  const sessionStateMessage = React.useMemo(() => {
    if (!blockedReason) {
      return "Your video visit is ready to join.";
    }

    const normalized = blockedReason.toLowerCase();
    if (normalized.includes("join opens")) {
      return "Your appointment is confirmed. Join opens automatically in the allowed window.";
    }
    if (normalized.includes("payment is required")) {
      return "The appointment needs a verified payment before video access can open.";
    }
    return blockedReason;
  }, [blockedReason]);

  const loadPreviewStream = React.useCallback(
    async (
      nextVideoDeviceId: string,
      nextAudioDeviceId: string,
      nextVideoEnabled: boolean,
      nextAudioEnabled: boolean
    ) => {
      const shouldShowLoader = !mediaStreamRef.current;
      if (shouldShowLoader) {
        setIsRequesting(true);
      }
      setPermissionError(null);

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;

      try {
        if (!nextVideoEnabled && !nextAudioEnabled) {
          setMediaStream(null);
          setSelectedVideoDeviceId(nextVideoDeviceId);
          setSelectedAudioDeviceId(nextAudioDeviceId);
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
          return;
        }

        let stream: MediaStream | null = null;
        let hasVideoTrack = false;
        let hasAudioTrack = false;

        if (nextVideoEnabled) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: nextVideoDeviceId
                ? { deviceId: { exact: nextVideoDeviceId } }
                : true,
              audio: nextAudioEnabled
                ? nextAudioDeviceId
                  ? { deviceId: { exact: nextAudioDeviceId } }
                  : true
                : false,
            });
          } catch (combinedErr) {
            console.warn("[VIDEO] Combined preview capture failed, retrying with video only:", combinedErr);
            stream = await navigator.mediaDevices.getUserMedia({
              video: nextVideoDeviceId
                ? { deviceId: { exact: nextVideoDeviceId } }
                : true,
              audio: false,
            });
          }

          hasVideoTrack = !!stream.getVideoTracks()[0];
          hasAudioTrack = !!stream.getAudioTracks()[0];

          if (!hasAudioTrack && nextAudioEnabled) {
            try {
              const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: nextAudioDeviceId
                  ? { deviceId: { exact: nextAudioDeviceId } }
                  : true,
              });
              const audioTrack = audioOnlyStream.getAudioTracks()[0];
              if (audioTrack) {
                stream.addTrack(audioTrack);
                hasAudioTrack = true;
              }
            } catch (audioErr) {
              console.warn("[VIDEO] Microphone preview unavailable, keeping video preview only:", audioErr);
            }
          }
        } else if (nextAudioEnabled) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: nextAudioDeviceId
              ? { deviceId: { exact: nextAudioDeviceId } }
              : true,
          });
          hasAudioTrack = !!stream.getAudioTracks()[0];
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const nextVideoDevices = devices.filter((device) => device.kind === "videoinput");
        const nextAudioDevices = devices.filter((device) => device.kind === "audioinput");

        if (!stream) {
          throw new Error("Unable to open camera or microphone.");
        }
        const resolvedVideoDeviceId =
          stream.getVideoTracks()[0]?.getSettings()?.deviceId ||
          nextVideoDeviceId ||
          nextVideoDevices[0]?.deviceId ||
          "";
        const resolvedAudioDeviceId =
          stream.getAudioTracks()[0]?.getSettings()?.deviceId ||
          nextAudioDeviceId ||
          nextAudioDevices[0]?.deviceId ||
          "";

        mediaStreamRef.current = stream;
        setMediaStream(stream);
        setVideoDevices(nextVideoDevices);
        setAudioDevices(nextAudioDevices);
        setSelectedVideoDeviceId(resolvedVideoDeviceId);
        setSelectedAudioDeviceId(resolvedAudioDeviceId);
        setIsAudioEnabled(nextAudioEnabled && hasAudioTrack);
        setIsVideoEnabled(nextVideoEnabled && hasVideoTrack);
      } catch (err) {
        setPermissionError(
          err instanceof Error
            ? (err.name === "AbortError" || err.message.includes("Timeout"))
              ? "Your camera took too long to start. Try refreshing or selecting a different device."
              : err.message
            : "Camera and microphone access is required to join the meeting."
        );
      } finally {
        if (shouldShowLoader) {
          setIsRequesting(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    void loadPreviewStream("", "", true, true);

    return () => {
      if (previewHandedOffRef.current) {
        return;
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, [loadPreviewStream]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!mediaStream) {
      video.srcObject = null;
      return;
    }

    video.srcObject = mediaStream;
    video.load();
    video.muted = true;
    video.playsInline = true;
    const startPlayback = () => {
      void video.play().catch(() => undefined);
    };
    if (video.readyState >= 2) {
      startPlayback();
      return;
    }
    video.addEventListener("loadedmetadata", startPlayback, { once: true });
    return () => {
      video.removeEventListener("loadedmetadata", startPlayback);
    };
  }, [mediaStream]);

  const toggleAudio = () => {
    const next = !isAudioEnabled;
    const audioTrack = mediaStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = next;
    }
    setIsAudioEnabled(next);
  };

  const toggleVideo = () => {
    const next = !isVideoEnabled;
    void loadPreviewStream(selectedVideoDeviceId, selectedAudioDeviceId, next, isAudioEnabled);
  };

  const handleVideoDeviceChange = (deviceId: string) => {
    const resolvedDeviceId = deviceId === "default-camera" ? "" : deviceId;
    setSelectedVideoDeviceId(resolvedDeviceId);
    void loadPreviewStream(resolvedDeviceId, selectedAudioDeviceId, isVideoEnabled, isAudioEnabled);
  };

  const handleAudioDeviceChange = (deviceId: string) => {
    const resolvedDeviceId = deviceId === "default-mic" ? "" : deviceId;
    setSelectedAudioDeviceId(resolvedDeviceId);
    void loadPreviewStream(selectedVideoDeviceId, resolvedDeviceId, isVideoEnabled, isAudioEnabled);
  };

  const handleJoin = async () => {
    previewHandedOffRef.current = true;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    const currentUserId = session?.user?.id || "";
    if (!currentUserId) {
      setPermissionError("You must be signed in to join the consultation.");
      return;
    }

    try {
      setIsJoiningRoom(true);
      setPermissionError(null);

      const tokenResult = await generateVideoToken({
        appointmentId: resolvedAppointmentId,
        userId: currentUserId,
        userRole: resolveVideoTokenRole(viewerRole || session?.user?.role || null),
        userInfo: {
          displayName:
            session?.user?.name ||
            [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(" ") ||
            "Participant",
          email: session?.user?.email || "",
        },
      });

      const resolvedAccess: VideoRoomAccess = {
        provider: resolveVideoProvider(
          (tokenResult as { provider?: string | null })?.provider || (appointmentDetailsSource as { provider?: string | null })?.provider,
          (tokenResult as { meetingUrl?: string | null })?.meetingUrl || meetingUrl
        ),
        token: String((tokenResult as { token?: string | null })?.token || ""),
        roomName: String(
          (tokenResult as { roomName?: string | null })?.roomName ||
            appointmentDetailsSource?.roomName ||
            appointmentDoctorLabel ||
            `Room ${appointmentSessionLabel}`
        ),
        meetingUrl: String((tokenResult as { meetingUrl?: string | null })?.meetingUrl || meetingUrl),
        roomId: String((tokenResult as { roomId?: string | null })?.roomId || ""),
        meetingId: String((tokenResult as { meetingId?: string | null })?.meetingId || ""),
      };

      if (resolvedAccess.provider === "google-meet" && resolvedAccess.meetingUrl) {
        window.open(resolvedAccess.meetingUrl, "_blank", "noopener,noreferrer");
      }

      setJoinedAccess(resolvedAccess);
    } catch (error) {
      setPermissionError(
        error instanceof Error ? error.message : "Unable to join the video consultation."
      );
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleCopyMeetingLink = async () => {
    if (!meetingUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(meetingUrl);
    } catch {
      // Ignore clipboard failures; users can still use the visible link.
    }
  };

  const handleLeaveRoom = React.useCallback(() => {
    // Stop all media tracks before navigating away
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.opener) {
      window.close();
      return;
    }
    router.replace(exitRoute);
  }, [exitRoute, onBack, router]);

  const handleLeavePreview = () => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.opener) {
      window.close();
      return;
    }
    router.replace(exitRoute);
  };

  if (isPending || !appointment || isRequesting) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#111315] px-6 text-center text-white">
        <div className="space-y-4 max-w-xs w-full">
          <div className="relative mx-auto h-14 w-14">
            <div className="h-full w-full animate-spin rounded-full border-2 border-[#8ab4f8]/20 border-t-[#8ab4f8]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="h-6 w-6 text-[#8ab4f8]" />
            </div>
          </div>
          <div>
            <p className="text-[16px] font-medium text-white">Getting ready…</p>
            <p className="mt-1 text-[13px] text-[#9aa0a6]">Preparing your consultation.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || permissionError) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#111315] px-6 text-center text-white">
        <div className="max-w-sm w-full rounded-2xl border border-[#ea4335]/20 bg-[#ea4335]/10 px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ea4335]/20">
            <VideoOff className="h-7 w-7 text-[#f28b82]" />
          </div>
          <p className="text-[16px] font-semibold text-white">Unable to join</p>
          <p className="mt-2 text-[13px] text-[#9aa0a6]">
            {permissionError || "Unable to load this meeting."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-[#8ab4f8] px-6 py-2.5 text-[13px] font-semibold text-[#202124] hover:bg-[#aecbfa] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (joinedAccess) {
    return (
      <VideoAppointmentRoomWorkspace
        appointment={appointmentDetailsSource || appointment}
        viewerRole={viewerRole}
        access={joinedAccess}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="relative min-h-dvh w-full overflow-y-auto bg-[#111315] text-white">
      {/* Subtle background glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(138,180,248,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(52,168,83,0.06),transparent_40%)]" />

      {/* Full-height centered on desktop, scrollable column on mobile */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-0 px-4 py-6 sm:px-6 sm:py-8 lg:min-h-dvh lg:flex-row lg:items-center lg:gap-10 lg:px-10 lg:py-0">

        {/* ── Left: Video preview ── */}
        <div className="w-full flex-shrink-0 lg:w-[56%]">
          {/* Video card */}
          <div className="relative w-full overflow-hidden rounded-2xl bg-[#1e1f20] border border-white/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ea4335] via-[#fbbc05] to-[#34a853]" />

            {/* 3:4 portrait on mobile, 16:9 landscape on desktop */}
            <div className="relative w-full aspect-[3/4] lg:aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover transition-opacity duration-300 ${isMirrored ? "-scale-x-100" : ""} ${isVideoEnabled ? "opacity-100" : "opacity-0"}`}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1f20]">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#3c4043]">
                    <VideoOff className="h-12 w-12 text-[#9aa0a6]" />
                  </div>
                  <p className="mt-3 text-[13px] text-[#9aa0a6]">Camera is off</p>
                </div>
              )}

              {/* Mic + Camera overlay */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-5 bg-gradient-to-t from-black/75 to-transparent pb-8 pt-20">
                <button
                  type="button"
                  onClick={toggleAudio}
                  aria-pressed={isAudioEnabled}
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${isAudioEnabled ? "bg-[#3c4043]/90 text-white hover:bg-[#5f6368]" : "bg-[#ea4335] text-white hover:bg-[#d93025]"}`}
                >
                  {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </button>
                <button
                  type="button"
                  onClick={toggleVideo}
                  aria-pressed={isVideoEnabled}
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${isVideoEnabled ? "bg-[#3c4043]/90 text-white hover:bg-[#5f6368]" : "bg-[#ea4335] text-white hover:bg-[#d93025]"}`}
                >
                  {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Device selectors — compact */}
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            <Select value={selectedAudioDeviceId} onValueChange={handleAudioDeviceChange}>
              <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-white/10 bg-[#2d2e30] px-3 text-[12px] text-white focus:ring-1 focus:ring-[#8ab4f8]/40 overflow-hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                  <Mic className="h-3.5 w-3.5 text-[#9aa0a6] shrink-0" />
                  <span className="truncate min-w-0 flex-1 text-left text-[12px]">
                    <SelectValue placeholder="Microphone" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border border-white/10 bg-[#2d2e30] text-white">
                {audioDevices.length === 0 ? (
                  <SelectItem value="default-mic" className="py-1.5 text-[12px]">Default microphone</SelectItem>
                ) : (
                  audioDevices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="py-1.5 text-[12px] focus:bg-white/10 focus:text-white">
                      {device.label || `Microphone ${index + 1}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select value={selectedVideoDeviceId} onValueChange={handleVideoDeviceChange}>
              <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border border-white/10 bg-[#2d2e30] px-3 text-[12px] text-white focus:ring-1 focus:ring-[#8ab4f8]/40 overflow-hidden">
                <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                  <Video className="h-3.5 w-3.5 text-[#9aa0a6] shrink-0" />
                  <span className="truncate min-w-0 flex-1 text-left text-[12px]">
                    <SelectValue placeholder="Camera" />
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border border-white/10 bg-[#2d2e30] text-white">
                {videoDevices.length === 0 ? (
                  <SelectItem value="default-camera" className="py-1.5 text-[12px]">Default camera</SelectItem>
                ) : (
                  videoDevices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="py-1.5 text-[12px] focus:bg-white/10 focus:text-white">
                      {device.label || `Camera ${index + 1}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Right: Meeting info + join ── */}
        <div className="mt-5 flex w-full flex-col lg:mt-0 lg:flex-1 lg:justify-center">
          <h1 className="text-center text-[26px] sm:text-[30px] lg:text-[38px] font-bold text-white tracking-tight lg:text-left">
            {sessionStateLabel}
          </h1>
          <p className="mt-2 text-center text-[14px] lg:text-[16px] text-[#9aa0a6] lg:text-left">
            Meeting with <span className="font-semibold text-white">{meetingWithLabel}</span>
          </p>

          {/* Provider info — dev only */}
          <div className="mt-3 inline-flex max-w-full items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-left">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <p className="text-[12px] leading-5 text-emerald-50/90">
              Join opens 5 minutes before your visit and stays open for 3 hours after start.
            </p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0a6]">Provider</span>
              <span className="text-[12px] font-semibold text-white">{meetingProviderLabel}</span>
              <span className="text-white/20">·</span>
              <span className="text-[10px] font-mono text-[#9aa0a6]">{appointmentSessionLabel}</span>
              <span className="text-white/20">·</span>
              <span className="text-[11px] text-[#9aa0a6] truncate min-w-0">{meetingUrlLabel}</span>
            </div>
          )}

          {/* Blocked reason */}
          {blockedReason && (
            <div className="mt-4 w-full rounded-xl border border-[#fbbc05]/20 bg-[#fbbc05]/8 px-4 py-3 text-[13px] text-[#fbbc05]">
              {sessionStateMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex w-full flex-col gap-3">
            {!blockedReason && (
              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={!meetingUrl || isJoiningRoom}
                className="group relative w-full overflow-hidden rounded-full bg-[#8ab4f8] px-6 py-3.5 text-[15px] font-bold text-[#202124] transition-all hover:bg-[#aecbfa] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#8ab4f8]/30"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isJoiningRoom ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Joining…
                    </>
                  ) : (
                    "Join now"
                  )}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLeavePreview}
              className="w-full rounded-full border border-white/20 bg-white/8 px-6 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-white/15 hover:border-white/30 active:scale-[0.98]"
            >
              Return
            </button>
          </div>

          {/* Copy / open for non-daily */}
          {meetingUrl && !blockedReason && !isDailyProvider && (
            <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCopyMeetingLink}
                className="flex-1 rounded-full border border-white/15 bg-white/5 py-2.5 text-[13px] font-medium text-white hover:bg-white/10 transition active:scale-[0.98]"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={() => void handleJoin()}
                className="flex-1 rounded-full bg-[#34a853] py-2.5 text-[13px] font-semibold text-white hover:bg-[#2d9248] transition active:scale-[0.98] shadow-lg shadow-[#34a853]/20"
              >
                Open meeting
              </button>
            </div>
          )}

          {/* Footer info */}
          <div className="mt-8 flex flex-col items-center gap-1.5 text-[12px] text-[#5f6368] lg:items-start">
            {appointmentTimeSlotLabel !== "TBD" && (
              <p className="text-[#9aa0a6]">Scheduled: <span className="text-white/70">{appointmentTimeSlotLabel}</span></p>
            )}
            <p className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Shield className="h-3.5 w-3.5 text-[#34a853]" />
              <span className="text-[#34a853]">Secure</span>
              <span className="text-[#5f6368]">Session: {appointmentSessionLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

