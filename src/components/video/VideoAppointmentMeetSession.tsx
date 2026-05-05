"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, MicOff, Video, VideoOff, Phone, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoAppointmentMeetRoom } from "@/components/video/VideoAppointmentMeetRoom";
import { useAppointment } from "@/hooks/query/useAppointments";
import { useVideoAppointment } from "@/hooks/query/useVideoAppointments";
import { formatDateTimeInIST, formatTimeInIST, nowIso } from "@/lib/utils/date-time";
import {
  getAppointmentDoctorName,
  getAppointmentPatientName,
  getAppointmentViewState,
  getVideoSessionDecision,
} from "@/lib/utils/appointmentUtils";
import { getVideoSessionExitRoute } from "@/lib/utils/video-session-route";
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
    new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

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
    confirmedSlotIndex:
      appointment?.confirmedSlotIndex ??
      appointment?.confirmed_slot_index ??
      null,
    proposedSlots:
      appointment?.proposedSlots ??
      appointment?.proposed_slots ??
      undefined,
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

export function VideoAppointmentMeetSession({
  appointmentId,
  viewerRole,
  onBack,
}: VideoAppointmentMeetSessionProps) {
  const router = useRouter();
  const resolvedAppointmentId = appointmentId.trim();
  const { data: appointmentQuery, isPending, error } =
    useVideoAppointment(resolvedAppointmentId);
  const { data: appointmentRecordQuery } = useAppointment(resolvedAppointmentId);
  const [appointment, setAppointment] = React.useState<VideoAppointment | null>(
    null
  );
  const [hasJoined, setHasJoined] = React.useState(false);
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
    () => (appointmentQuery as any)?.appointment || (appointmentQuery as any)?.data || appointment,
    [appointmentQuery, appointment]
  );
  const appointmentDetailsSource = React.useMemo(() => {
    if (appointmentRecordSource && appointmentConsultationSource) {
      const merged: Record<string, unknown> = { ...appointmentConsultationSource };

      for (const [key, value] of Object.entries(appointmentRecordSource as Record<string, unknown>)) {
        if (value !== undefined) {
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
  const videoSessionDecision = React.useMemo(
    () => getVideoSessionDecision(appointmentDetailsSource || appointment),
    [appointment, appointmentDetailsSource]
  );
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

  React.useEffect(() => {
    const liveAppointmentSource =
      (appointmentQuery as any)?.appointment || (appointmentQuery as any)?.data || null;

    if (!resolvedAppointmentId || !liveAppointmentSource) {
      return;
    }

    setAppointment(normalizeAppointment(liveAppointmentSource, resolvedAppointmentId));
  }, [appointmentQuery, resolvedAppointmentId]);

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

  const handleJoin = () => {
    previewHandedOffRef.current = true;
    setHasJoined(true);
  };

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
      <div className="flex min-h-dvh w-full items-center justify-center px-4 py-6 text-center bg-background text-foreground dark:bg-meet-black dark:text-white">
        <div className="rounded-3xl border border-border bg-card px-5 py-4 text-center shadow-sm sm:px-6 sm:py-5 dark:border-dark-gray dark:bg-meet-black">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-foreground dark:text-white" />
          <p className="mt-3 text-sm font-medium">Getting ready...</p>
        </div>
      </div>
    );
  }

  if (error || permissionError) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center px-4 py-6 text-center bg-background text-foreground dark:bg-meet-black dark:text-white">
        <div className="max-w-md rounded-3xl border border-border bg-card px-5 py-5 text-center shadow-sm sm:px-6 sm:py-6 dark:border-dark-gray dark:bg-meet-black">
          <p className="text-lg font-semibold">Permissions required</p>
          <p className="mt-2 text-sm text-muted-foreground dark:text-gray-400">
            {permissionError || "Unable to load this meeting."}
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="rounded-full bg-meet-blue text-white hover:bg-blue-600"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasJoined) {
    return (
      <VideoAppointmentMeetRoom
        appointment={appointment}
        startWithAudioEnabled={isAudioEnabled}
        startWithVideoEnabled={isVideoEnabled}
        initialMediaStream={mediaStream}
        onLeaveRoom={handleLeavePreview}
      />
    );
  }
  return (
      <div className="relative flex min-h-dvh w-full flex-col items-stretch justify-center gap-4 overflow-hidden bg-background px-4 py-6 text-foreground dark:bg-meet-black dark:text-white sm:px-6 sm:py-8 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(26,115,232,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(52,168,83,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.94))] dark:bg-[radial-gradient(circle_at_top_right,rgba(138,180,248,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(52,168,83,0.12),transparent_28%),linear-gradient(180deg,rgba(32,33,36,0.94),rgba(32,33,36,0.98))]" />
      
      {/* Left side: Video Preview */}
      <div className="w-full max-w-3xl flex flex-col gap-4 z-10 lg:w-[65%]">
        <div className={`${MEET_INFO_CARD} relative aspect-video w-full overflow-hidden`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ea4335] via-[#fbbc05] to-[#34a853]" />
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover transition-opacity duration-500 ${
              isMirrored ? "-scale-x-100" : ""
            } ${isVideoEnabled ? "opacity-100" : "opacity-0"}`}
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-card px-4 text-center dark:bg-meet-black">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-linear-to-br from-[#ea4335] via-[#fbbc05] to-[#34a853] shadow-lg shadow-blue-500/10">
                <VideoOff className="h-12 w-12 text-white" />
              </div>
              <p className="text-xl font-normal text-foreground dark:text-white">Camera is off</p>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex justify-center pb-8">
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                onClick={toggleAudio}
                aria-pressed={isAudioEnabled}
                className={`h-14 w-14 rounded-full transition-all ${isAudioEnabled ? MEET_MEDIA_BUTTON_ON : MEET_MEDIA_BUTTON_OFF}`}
              >
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              <Button
                type="button"
                onClick={toggleVideo}
                aria-pressed={isVideoEnabled}
                className={`h-14 w-14 rounded-full transition-all ${isVideoEnabled ? MEET_MEDIA_BUTTON_ON : MEET_MEDIA_BUTTON_OFF}`}
              >
                {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 px-1 sm:grid-cols-2 sm:px-2">
          <div className="space-y-1">
            <Select value={selectedAudioDeviceId} onValueChange={handleAudioDeviceChange}>
            <SelectTrigger className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-none hover:bg-muted dark:border-dark-gray dark:bg-transparent dark:text-[#9aa0a6] dark:hover:bg-dark-gray focus:ring-1 focus:ring-blue-500">
                <Mic className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Microphone" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-border bg-popover text-popover-foreground dark:border-dark-gray dark:bg-[#2d2e30] dark:text-white">
                {audioDevices.length === 0 ? (
                  <SelectItem value="default-mic" className="py-2">Default microphone</SelectItem>
                ) : (
                  audioDevices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="py-2 focus:bg-muted focus:text-foreground dark:focus:bg-[#4a4d51] dark:focus:text-white">
                      {device.label || `Microphone ${index + 1}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Select value={selectedVideoDeviceId} onValueChange={handleVideoDeviceChange}>
            <SelectTrigger className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-none hover:bg-muted dark:border-dark-gray dark:bg-transparent dark:text-[#9aa0a6] dark:hover:bg-dark-gray focus:ring-1 focus:ring-blue-500">
                <Video className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Camera" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-border bg-popover text-popover-foreground dark:border-dark-gray dark:bg-[#2d2e30] dark:text-white">
                {videoDevices.length === 0 ? (
                  <SelectItem value="default-camera" className="py-2">Default camera</SelectItem>
                ) : (
                  videoDevices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="py-2 focus:bg-muted focus:text-foreground dark:focus:bg-[#4a4d51] dark:focus:text-white">
                      {device.label || `Camera ${index + 1}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Right side: Meeting details & Join button */}
      <div className="flex w-full max-w-sm flex-col items-center text-center z-10 p-2 sm:p-4 lg:w-[35%] lg:items-center">
        <div className={MEET_STATUS_BADGE}>
          {videoSessionDecision.blockedReason ? "Session unavailable" : "Ready to join"}
        </div>
        <h1 className="mt-3 text-3xl sm:text-[36px] font-normal text-foreground dark:text-white mb-2 tracking-tight">
          {videoSessionDecision.blockedReason ? "This session is closed" : "Ready to join?"}
        </h1>
        <p className="text-muted-foreground dark:text-[#9aa0a6] text-base mb-8 font-normal">
          Meeting with <span className="text-foreground font-medium dark:text-white">{meetingWithLabel}</span>
        </p>
        
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {!videoSessionDecision.blockedReason ? (
            <Button
              onClick={handleJoin}
              className={`h-12 w-full rounded-full px-6 text-[14px] font-medium shadow-md shadow-blue-500/20 transition-all border-0 hover:shadow-lg hover:shadow-blue-500/30 sm:w-auto ${MEET_JOIN_BUTTON}`}
            >
              Join now
            </Button>
          ) : (
            <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              {videoSessionDecision.blockedReason}
            </div>
          )}
          <Button
            onClick={handleLeavePreview}
            variant="outline"
            className={`h-12 w-full rounded-full px-6 text-[14px] font-medium transition-colors sm:w-auto ${MEET_SECONDARY_BUTTON}`}
          >
            Return
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground dark:text-[#9aa0a6] w-full flex flex-col items-center gap-2">
          {appointmentTimeSlotLabel !== "TBD" && (
             <p>Scheduled: {appointmentTimeSlotLabel}</p>
          )}
          <p className="flex items-center gap-2 text-xs uppercase tracking-wider mt-4">
            <Shield className="h-4 w-4" /> Secure Session: {appointmentSessionLabel}
          </p>
        </div>
      </div>

    </div>
  );
}

