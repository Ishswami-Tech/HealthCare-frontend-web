"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAppointment } from "@/hooks/query/useAppointments";
import { useVideoAppointment } from "@/hooks/query/useVideoAppointments";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  formatDateInIST,
  formatDateTimeInIST,
  formatTimeInIST,
  nowIso,
} from "@/lib/utils/date-time";
import {
  formatDoctorDisplayName,
  getAppointmentDoctorName,
  getAppointmentPatientName,
  getAppointmentViewState,
  getDisplayAppointmentDuration,
  getVideoSessionDecision,
  VIDEO_JOIN_WINDOW_TEXT,
} from "@/lib/utils/appointmentUtils";
import { getAppointmentDateTimeValue } from "@/lib/utils/clock";
import { getVideoSessionExitRoute } from "@/lib/utils/video-session-route";
import { generateVideoToken } from "@/lib/actions/video.server";
import {
  VideoAppointmentRoomWorkspace,
  type VideoRoomAccess,
} from "@/components/video/VideoAppointmentRoomWorkspace";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";
import { VideoLobbyView } from "@/components/video/lobby/VideoLobbyView";
import {
  VideoLobbyError,
  VideoLobbyLoading,
} from "@/components/video/lobby/VideoLobbyStatus";
import { videoPortalLabel } from "@/components/video/lobby/VideoStageShell";
import { getAppointmentDoctorPhoto } from "@/components/video/lobby/videoVisitPeople";

const VIDEO_ACTIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

type VideoAppointmentMeetSessionProps = {
  appointmentId: string;
  viewerRole?: string;
  onBack?: () => void;
};

function normalizeAppointment(
  appointment: any,
  fallbackId: string,
): VideoAppointment | null {
  const resolvedAppointmentId = String(
    appointment?.appointmentId || fallbackId || appointment?.id || "",
  );

  if (!resolvedAppointmentId) return null;

  const consultationSessionId = String(appointment?.id || "");
  const startTime =
    appointment?.scheduledStartTime ||
    appointment?.startTime ||
    appointment?.appointmentDate ||
    appointment?.scheduledFor ||
    appointment?.createdAt ||
    nowIso();

  const endTime =
    appointment?.scheduledEndTime ||
    appointment?.endTime ||
    new Date(
      new Date(startTime).getTime() + VIDEO_ACTIVE_WINDOW_MS,
    ).toISOString();

  return {
    id: resolvedAppointmentId,
    appointmentId: resolvedAppointmentId,
    roomName:
      appointment?.roomName ||
      appointment?.doctorName ||
      `Room ${resolvedAppointmentId}`,
    patientName:
      appointment?.patientName ||
      appointment?.patient?.user?.name ||
      appointment?.patient?.name,
    doctorName:
      appointment?.doctorName ||
      appointment?.doctor?.user?.name ||
      appointment?.doctor?.name,
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

function resolveVideoTokenRole(
  role?: string | null,
): "patient" | "doctor" | "receptionist" | "clinic_admin" {
  switch (
    String(role || "")
      .trim()
      .toUpperCase()
  ) {
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
  meetingUrl?: string | null,
): VideoRoomAccess["provider"] {
  const normalized = String(accessProvider || "")
    .trim()
    .toLowerCase();
  if (
    normalized === "cloudflare" ||
    normalized === "daily" ||
    normalized === "google-meet"
  ) {
    return normalized;
  }

  const url = String(meetingUrl || "")
    .trim()
    .toLowerCase();
  if (url.includes("meet.google.com")) return "google-meet";
  if (url.includes("daily.co")) return "daily";
  return "cloudflare";
}

function formatViewerRoleLabel(role?: string | null): string {
  switch (
    String(role || "")
      .trim()
      .toUpperCase()
  ) {
    case "PATIENT":
      return "Patient";
    case "DOCTOR":
      return "Doctor";
    case "ASSISTANT_DOCTOR":
      return "Assistant Doctor";
    case "THERAPIST":
      return "Therapist";
    case "COUNSELOR":
      return "Counselor";
    case "RECEPTIONIST":
      return "Receptionist";
    case "NURSE":
      return "Nurse";
    case "CLINIC_ADMIN":
      return "Clinic Admin";
    case "CLINIC_LOCATION_HEAD":
      return "Location Head";
    case "SUPER_ADMIN":
      return "Super Admin";
    default:
      return "Participant";
  }
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
  const { replace } = useRouter();
  const { session } = useAuth();
  const clinicId = useCurrentClinicId();
  const effectiveViewerRole = session?.user?.role || viewerRole || "";
  const resolvedAppointmentId = appointmentId.trim();
  const {
    data: appointmentQuery,
    isPending,
    error,
  } = useVideoAppointment(resolvedAppointmentId);
  const { data: appointmentRecordQuery } = useAppointment(
    resolvedAppointmentId,
  );
  type VideoMeetState = {
    isRequesting: boolean;
    permissionError: string | null;
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
    selectedVideoDeviceId: string;
    selectedAudioDeviceId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isMirrored: boolean;
    isJoiningRoom: boolean;
    joinedAccess: VideoRoomAccess | null;
  };

  const [uiState, setUiState] = React.useState<VideoMeetState>({
    isRequesting: true,
    permissionError: null,
    videoDevices: [],
    audioDevices: [],
    selectedVideoDeviceId: "",
    selectedAudioDeviceId: "",
    isAudioEnabled: true,
    isVideoEnabled: true,
    isMirrored: true,
    isJoiningRoom: false,
    joinedAccess: null,
  });
  const {
    isRequesting,
    permissionError,
    videoDevices,
    audioDevices,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    isAudioEnabled,
    isVideoEnabled,
    isMirrored,
    isJoiningRoom,
    joinedAccess,
  } = uiState;
  const patchUiState = (patch: Partial<VideoMeetState>) =>
    setUiState((current) => ({ ...current, ...patch }));
  const setIsRequesting = (value: boolean) =>
    patchUiState({ isRequesting: value });
  const setPermissionError = (value: string | null) =>
    patchUiState({ permissionError: value });
  const setVideoDevices = (value: MediaDeviceInfo[]) =>
    patchUiState({ videoDevices: value });
  const setAudioDevices = (value: MediaDeviceInfo[]) =>
    patchUiState({ audioDevices: value });
  const setSelectedVideoDeviceId = (value: string) =>
    patchUiState({ selectedVideoDeviceId: value });
  const setSelectedAudioDeviceId = (value: string) =>
    patchUiState({ selectedAudioDeviceId: value });
  const setIsAudioEnabled = (value: boolean) =>
    patchUiState({ isAudioEnabled: value });
  const setIsVideoEnabled = (value: boolean) =>
    patchUiState({ isVideoEnabled: value });
  const setIsMirrored = (value: boolean) => patchUiState({ isMirrored: value });
  const setIsJoiningRoom = (value: boolean) =>
    patchUiState({ isJoiningRoom: value });
  const setJoinedAccess = (value: VideoRoomAccess | null) =>
    patchUiState({ joinedAccess: value });
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const previewHandedOffRef = React.useRef(false);
  // The lobby's <video> mounts only after the first camera request has finished, so the stream
  // that is already running is attached here (the request itself could not reach the element).
  const attachPreviewVideo = React.useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      const stream = mediaStreamRef.current;
      if (node && stream && node.srcObject !== stream) {
        node.srcObject = stream;
        node.muted = true;
        node.playsInline = true;
        void node.play().catch(() => {});
      }
    },
    [],
  );
  const appointmentRecordSource = React.useMemo(
    () =>
      (appointmentRecordQuery as any)?.appointment ||
      (appointmentRecordQuery as any)?.data ||
      appointmentRecordQuery ||
      null,
    [appointmentRecordQuery],
  );
  const appointmentConsultationSource = React.useMemo(
    () =>
      (appointmentQuery as any)?.appointment ||
      (appointmentQuery as any)?.data ||
      null,
    [appointmentQuery],
  );
  const appointmentDetailsSource = React.useMemo(() => {
    if (appointmentRecordSource && appointmentConsultationSource) {
      const merged: Record<string, unknown> = {
        ...(appointmentConsultationSource as Record<string, unknown>),
        ...(appointmentRecordSource as Record<string, unknown>),
      };

      const consultation = appointmentConsultationSource as Record<
        string,
        unknown
      >;
      const protectedSessionFields = [
        "roomName",
        "meetingUrl",
        "roomId",
        "meetingId",
        "provider",
        "token",
        "patientName",
        "doctorName",
      ];
      for (const key of protectedSessionFields) {
        const value = consultation[key];
        if (isMergeableValue(value)) {
          merged[key] = value;
        }
      }

      if (isMergeableValue(consultation.patientName)) {
        merged.patientName = consultation.patientName;
      }
      if (isMergeableValue(consultation.doctorName)) {
        merged.doctorName = consultation.doctorName;
      }

      if (
        isMergeableValue(consultation.id) &&
        consultation.id !==
          (appointmentRecordSource as Record<string, unknown>).id
      ) {
        merged.sessionId = consultation.id;
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
  const resolvedClinicId = React.useMemo(
    () =>
      String(
        (appointmentDetailsSource as { clinicId?: unknown } | null | undefined)
          ?.clinicId ||
          (appointmentRecordSource as { clinicId?: unknown } | null | undefined)
            ?.clinicId ||
          clinicId ||
          session?.user?.clinicId ||
          "",
      ).trim(),
    [appointmentDetailsSource, appointmentRecordSource, clinicId, session?.user?.clinicId],
  );
  const appointment = React.useMemo(
    () =>
      appointmentDetailsSource
        ? normalizeAppointment(appointmentDetailsSource, resolvedAppointmentId)
        : null,
    [appointmentDetailsSource, resolvedAppointmentId],
  );
  const videoSessionDecision = React.useMemo(
    () => getVideoSessionDecision(appointmentDetailsSource || appointment),
    [appointment, appointmentDetailsSource],
  );
  const meetingUrl = React.useMemo(() => {
    const raw = (
      appointmentDetailsSource as { meetingUrl?: unknown } | null | undefined
    )?.meetingUrl;
    return typeof raw === "string" ? raw.trim() : "";
  }, [appointmentDetailsSource]);
  const appointmentDoctorName = getAppointmentDoctorName(
    appointmentDetailsSource,
  );
  const appointmentPatientName = getAppointmentPatientName(
    appointmentDetailsSource,
  );
  const appointmentRecordScheduleSource = appointmentRecordSource as {
    appointmentDate?: string;
    date?: string;
    time?: string;
    scheduledFor?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    startTime?: string;
    endTime?: string;
    scheduledTime?: string;
  } | null;
  const appointmentDateValue =
    appointmentRecordScheduleSource?.scheduledStartTime ||
    appointmentRecordScheduleSource?.appointmentDate ||
    (appointmentRecordScheduleSource?.date &&
    appointmentRecordScheduleSource?.time
      ? `${appointmentRecordScheduleSource.date}T${appointmentRecordScheduleSource.time}`
      : "") ||
    appointmentRecordScheduleSource?.scheduledFor ||
    appointmentRecordScheduleSource?.startTime ||
    (
      appointmentDetailsSource as
        | { scheduledStartTime?: string }
        | null
        | undefined
    )?.scheduledStartTime ||
    appointmentDetailsSource?.appointmentDate ||
    appointmentDetailsSource?.date ||
    appointmentDetailsSource?.scheduledFor ||
    appointmentDetailsSource?.startTime ||
    appointmentDetailsSource?.createdAt ||
    "";
  const appointmentTimeValue =
    appointmentRecordScheduleSource?.time ||
    appointmentRecordScheduleSource?.scheduledTime ||
    appointmentRecordScheduleSource?.startTime ||
    (
      appointmentDetailsSource as
        | { scheduledStartTime?: string }
        | null
        | undefined
    )?.scheduledStartTime ||
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
    (appointmentDetailsSource as { provider?: unknown } | null | undefined)
      ?.provider || "",
  )
    .trim()
    .toLowerCase();
  const isDailyProvider =
    resolveVideoProvider(appointmentProvider || null, meetingUrl) === "daily";
  const meetingUrlLabel = isDailyProvider
    ? "In-app room available"
    : meetingUrl.length > 0
      ? meetingUrl.length > 64
        ? `${meetingUrl.slice(0, 61)}...`
        : meetingUrl
      : "Waiting for the backend to generate a meeting link";
  const appointmentDoctorLabel = appointmentDoctorName || "Doctor assigned";
  const appointmentPatientLabel = appointmentPatientName || "Patient TBD";
  const viewerRoleNormalized = String(effectiveViewerRole || "")
    .trim()
    .toUpperCase();
  const exitRoute = getVideoSessionExitRoute(viewerRoleNormalized);
  const viewerRoleLabel = formatViewerRoleLabel(effectiveViewerRole);
  const meetingWithLabel =
    appointmentDoctorLabel !== "Doctor TBD" &&
    appointmentPatientLabel !== "Patient TBD"
      ? `${appointmentDoctorLabel} (doctor) • ${appointmentPatientLabel} (patient)`
      : viewerRoleNormalized === "PATIENT"
        ? `${appointmentDoctorLabel} (doctor)`
        : viewerRoleNormalized === "DOCTOR" ||
            viewerRoleNormalized === "ASSISTANT_DOCTOR"
          ? `${appointmentPatientLabel} (patient)`
          : appointmentDoctorLabel !== "Doctor TBD"
            ? `${appointmentDoctorLabel} (doctor)`
            : appointmentPatientLabel !== "Patient TBD"
              ? `${appointmentPatientLabel} (patient)`
              : `${viewerRoleLabel} appointment`;
  const blockedReason = videoSessionDecision.blockedReason || "";
  const [countdownTime, setCountdownTime] = React.useState<string | null>(null);
  const hasAppointmentRecord = Boolean(appointmentRecordSource);
  const appointmentLoadFailed =
    !isPending &&
    !hasAppointmentRecord &&
    !appointment &&
    !error &&
    !permissionError;

  // Calculate countdown timer for "join opens"
  React.useEffect(() => {
    const updateCountdown = () => {
      const normalized = blockedReason.toLowerCase();
      if (!normalized.includes("join opens") || !appointment?.startTime) {
        setCountdownTime(null);
        return;
      }

      const now = new Date().getTime();
      const startTime = new Date(appointment.startTime).getTime();
      // Join opens 15 minutes before the appointment
      const joinOpenTime = startTime - 15 * 60 * 1000;
      const timeUntilJoinOpens = joinOpenTime - now;

      if (timeUntilJoinOpens <= 0) {
        setCountdownTime(null);
        return;
      }

      const hours = Math.floor(timeUntilJoinOpens / (1000 * 60 * 60));
      const minutes = Math.floor(
        (timeUntilJoinOpens % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds = Math.floor((timeUntilJoinOpens % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdownTime(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setCountdownTime(`${minutes}m ${seconds}s`);
      } else {
        setCountdownTime(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [blockedReason, appointment?.startTime]);

  const sessionStateLabel = React.useMemo(() => {
    if (!blockedReason) return "Ready to join";
    const normalized = blockedReason.toLowerCase();
    if (normalized.includes("join opens")) {
      return "Waiting for your visit";
    }
    if (normalized.includes("payment is required")) {
      return "Payment required";
    }
    if (
      normalized.includes("cancelled") ||
      normalized.includes("completed") ||
      normalized.includes("no-show")
    ) {
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
      return countdownTime
        ? `Your appointment is confirmed. Join link will be available in ${countdownTime}.`
        : "Your appointment is confirmed. Join opens automatically in the allowed window.";
    }
    if (normalized.includes("payment is required")) {
      return "The appointment needs a verified payment before video access can open.";
    }
    return blockedReason;
  }, [blockedReason, countdownTime]);

  const loadPreviewStream = React.useCallback(
    async (
      nextVideoDeviceId: string,
      nextAudioDeviceId: string,
      nextVideoEnabled: boolean,
      nextAudioEnabled: boolean,
    ) => {
      const shouldShowLoader = !mediaStreamRef.current;
      if (shouldShowLoader) {
        setIsRequesting(true);
      }
      setPermissionError(null);

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      try {
        if (!nextVideoEnabled && !nextAudioEnabled) {
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
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
            console.warn(
              "[VIDEO] Combined preview capture failed, retrying with video only:",
              combinedErr,
            );
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
              const audioOnlyStream = await navigator.mediaDevices.getUserMedia(
                {
                  video: false,
                  audio: nextAudioDeviceId
                    ? { deviceId: { exact: nextAudioDeviceId } }
                    : true,
                },
              );
              const audioTrack = audioOnlyStream.getAudioTracks()[0];
              if (audioTrack) {
                stream.addTrack(audioTrack);
                hasAudioTrack = true;
              }
            } catch (audioErr) {
              console.warn(
                "[VIDEO] Microphone preview unavailable, keeping video preview only:",
                audioErr,
              );
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

        if (!stream) {
          throw new Error("Unable to open camera or microphone.");
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const nextVideoDevices = devices.filter(
          (device) => device.kind === "videoinput",
        );
        const nextAudioDevices = devices.filter(
          (device) => device.kind === "audioinput",
        );
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
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          video.onloadedmetadata = () => {
            void video.play().catch((e) => console.warn("[VIDEO] Auto-play failed on loadedmetadata", e));
          };
          // Try to play immediately in case metadata is already available
          void video.play().catch(() => {});
        }
        setVideoDevices(nextVideoDevices);
        setAudioDevices(nextAudioDevices);
        setSelectedVideoDeviceId(resolvedVideoDeviceId);
        setSelectedAudioDeviceId(resolvedAudioDeviceId);
        setIsAudioEnabled(nextAudioEnabled && hasAudioTrack);
        setIsVideoEnabled(nextVideoEnabled && hasVideoTrack);
      } catch (err) {
        setPermissionError(
          err instanceof Error
            ? err.name === "AbortError" || err.message.includes("Timeout")
              ? "Your camera took too long to start. Try refreshing or selecting a different device."
              : err.message
            : "Camera and microphone access is required to join the meeting.",
        );
      } finally {
        if (shouldShowLoader) {
          setIsRequesting(false);
        }
      }
    },
    [],
  );

  React.useEffect(() => {
    void loadPreviewStream("", "", true, true);

    return () => {
      if (previewHandedOffRef.current) {
        return;
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [loadPreviewStream]);

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
    void loadPreviewStream(
      selectedVideoDeviceId,
      selectedAudioDeviceId,
      next,
      isAudioEnabled,
    );
  };

  const handleVideoDeviceChange = (deviceId: string) => {
    const resolvedDeviceId = deviceId === "default-camera" ? "" : deviceId;
    setSelectedVideoDeviceId(resolvedDeviceId);
    void loadPreviewStream(
      resolvedDeviceId,
      selectedAudioDeviceId,
      isVideoEnabled,
      isAudioEnabled,
    );
  };

  const handleAudioDeviceChange = (deviceId: string) => {
    const resolvedDeviceId = deviceId === "default-mic" ? "" : deviceId;
    setSelectedAudioDeviceId(resolvedDeviceId);
    void loadPreviewStream(
      selectedVideoDeviceId,
      resolvedDeviceId,
      isVideoEnabled,
      isAudioEnabled,
    );
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
        userRole: resolveVideoTokenRole(effectiveViewerRole),
        userInfo: {
          displayName:
            [session?.user?.firstName, session?.user?.lastName]
              .filter(Boolean)
              .join(" ") ||
            session?.user?.name ||
            "Participant",
          email: session?.user?.email || "",
        },
      }, resolvedClinicId || undefined);

      const resolvedAccess: VideoRoomAccess = {
        provider: resolveVideoProvider(
          (tokenResult as { provider?: string | null })?.provider ||
            (appointmentDetailsSource as { provider?: string | null })
              ?.provider,
          (tokenResult as { meetingUrl?: string | null })?.meetingUrl ||
            meetingUrl,
        ),
        token: String((tokenResult as { token?: string | null })?.token || ""),
        roomName: String(
          (tokenResult as { roomName?: string | null })?.roomName ||
            appointmentDetailsSource?.roomName ||
            appointmentDoctorLabel ||
            `Room ${appointmentSessionLabel}`,
        ),
        meetingUrl: String(
          (tokenResult as { meetingUrl?: string | null })?.meetingUrl ||
            meetingUrl,
        ),
        roomId: String(
          (tokenResult as { roomId?: string | null })?.roomId || "",
        ),
        meetingId: String(
          (tokenResult as { meetingId?: string | null })?.meetingId || "",
        ),
      };

      if (
        resolvedAccess.provider === "google-meet" &&
        resolvedAccess.meetingUrl
      ) {
        window.open(resolvedAccess.meetingUrl, "_blank", "noopener,noreferrer");
      }

      setJoinedAccess(resolvedAccess);
    } catch (error) {
      setPermissionError(
        error instanceof Error
          ? error.message
          : "Unable to join the video consultation.",
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
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.opener) {
      window.close();
      return;
    }
    replace(exitRoute);
  }, [exitRoute, onBack, replace]);

  const handleLeavePreview = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.opener) {
      window.close();
      return;
    }
    replace(exitRoute);
  };

  // ── presentation values for the lobby ──
  const portalLabel = videoPortalLabel(effectiveViewerRole);
  const isPatientViewer =
    viewerRoleNormalized === "" || viewerRoleNormalized === "PATIENT";
  const lobbyBackLabel = "Back to appointments";
  const lobbyStatusCode = videoSessionDecision.status || "";
  const scheduledStartSource = (
    appointmentDetailsSource as { scheduledStartTime?: unknown } | null | undefined
  )?.scheduledStartTime;
  const scheduledStartDate =
    typeof scheduledStartSource === "string" && scheduledStartSource
      ? new Date(scheduledStartSource)
      : getAppointmentDateTimeValue(
          appointmentRecordSource || appointmentDetailsSource,
        );
  const lobbyStartsAt =
    scheduledStartDate && !Number.isNaN(scheduledStartDate.getTime())
      ? scheduledStartDate
      : null;
  const lobbyDurationMinutes = getDisplayAppointmentDuration(
    appointmentRecordSource || appointmentDetailsSource,
  );
  const lobbyScheduledLabel = lobbyStartsAt
    ? [
        formatDateInIST(lobbyStartsAt, {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        lobbyDurationMinutes
          ? `${formatTimeInIST(lobbyStartsAt)} – ${formatTimeInIST(
              new Date(lobbyStartsAt.getTime() + lobbyDurationMinutes * 60_000),
            )}`
          : formatTimeInIST(lobbyStartsAt),
      ].join(" · ")
    : appointmentTimeSlotLabel !== "TBD"
      ? appointmentTimeSlotLabel
      : "Not set yet";
  const lobbyDoctorName = appointmentDoctorName
    ? appointmentDoctorName === "Doctor assigned"
      ? "Your doctor"
      : formatDoctorDisplayName(appointmentDoctorName)
    : "Your doctor";

  if (isPending || isRequesting) {
    return <VideoLobbyLoading portalLabel={portalLabel} />;
  }

  if (error || permissionError || appointmentLoadFailed) {
    return (
      <VideoLobbyError
        portalLabel={portalLabel}
        backLabel={lobbyBackLabel}
        message={
          permissionError ||
          error?.message ||
          "Unable to load this meeting. Please reopen the consultation from your appointment list."
        }
        onRetry={() => window.location.reload()}
        onBack={handleLeavePreview}
      />
    );
  }

  if (joinedAccess) {
    return (
      <VideoAppointmentRoomWorkspace
        appointment={appointmentDetailsSource || appointment}
        viewerRole={effectiveViewerRole}
        access={joinedAccess}
        onLeave={handleLeaveRoom}
      />
    );
  }

  const doctorPhotoUrl = getAppointmentDoctorPhoto(
    appointmentRecordSource || appointmentDetailsSource,
  );
  const showLinkActions = Boolean(meetingUrl) && !blockedReason && !isDailyProvider;

  return (
    <VideoLobbyView
      variant={isPatientViewer ? "patient" : "staff"}
      portalLabel={portalLabel}
      backLabel={lobbyBackLabel}
      onBack={handleLeavePreview}
      videoRef={attachPreviewVideo}
      isVideoEnabled={isVideoEnabled}
      isAudioEnabled={isAudioEnabled}
      isMirrored={isMirrored}
      onToggleAudio={toggleAudio}
      onToggleVideo={toggleVideo}
      audioDevices={audioDevices}
      videoDevices={videoDevices}
      selectedAudioDeviceId={selectedAudioDeviceId}
      selectedVideoDeviceId={selectedVideoDeviceId}
      onAudioDeviceChange={handleAudioDeviceChange}
      onVideoDeviceChange={handleVideoDeviceChange}
      doctorName={lobbyDoctorName}
      {...(doctorPhotoUrl ? { doctorPhotoUrl } : {})}
      meetingWithLabel={meetingWithLabel}
      statusCode={lobbyStatusCode}
      visitInProgress={lobbyStatusCode === "IN_PROGRESS"}
      startsAt={lobbyStartsAt ? lobbyStartsAt.toISOString() : null}
      scheduledLabel={lobbyScheduledLabel}
      sessionLabel={appointmentSessionLabel}
      joinWindowText={VIDEO_JOIN_WINDOW_TEXT}
      stateLabel={sessionStateLabel}
      stateMessage={sessionStateMessage}
      blocked={Boolean(blockedReason)}
      joinDisabled={!meetingUrl || isJoiningRoom}
      isJoining={isJoiningRoom}
      onJoin={() => void handleJoin()}
      {...(showLinkActions
        ? { onCopyLink: () => void handleCopyMeetingLink() }
        : {})}
      {...(lobbyStatusCode === "COMPLETED"
        ? {
            summaryHref: `/meet/${encodeURIComponent(resolvedAppointmentId)}/summary`,
          }
        : {})}
      {...(process.env.NODE_ENV === "development"
        ? { devInfo: `${appointmentSessionLabel} · ${meetingUrlLabel}` }
        : {})}
    />
  );
}
