"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, MicOff, Video, VideoOff, Phone, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoAppointmentMeetRoom } from "@/components/video/VideoAppointmentMeetRoom";
import { useVideoAppointment } from "@/hooks/query/useVideoAppointments";
import { formatDateTimeInIST, formatTimeInIST, nowIso } from "@/lib/utils/date-time";
import {
  getAppointmentDoctorName,
  getAppointmentPatientName,
  getAppointmentViewState,
} from "@/lib/utils/appointmentUtils";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";

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
  const [appointment, setAppointment] = React.useState<VideoAppointment | null>(
    null
  );
  const [hasJoined, setHasJoined] = React.useState(false);
  const [isRequesting, setIsRequesting] = React.useState(true);
  const [permissionError, setPermissionError] = React.useState<string | null>(
    null
  );
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
  const appointmentDetailsSource =
    (appointmentQuery as any)?.appointment || (appointmentQuery as any)?.data || appointment;
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
  const appointmentDoctorLabel = appointmentDoctorName || "Doctor TBD";
  const appointmentPatientLabel = appointmentPatientName || "Patient TBD";
  const viewerRoleNormalized = String(viewerRole || "").trim().toUpperCase();
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
      nextVideoEnabled = isVideoEnabled,
      nextAudioEnabled = isAudioEnabled
    ) => {
      setIsRequesting(true);
      setPermissionError(null);

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;

      // Add a small delay to allow hardware to reset before requesting again
      // This helps prevent "AbortError: Timeout starting video source"
      await new Promise(resolve => setTimeout(resolve, 150));

      try {
        if (!nextVideoEnabled && !nextAudioEnabled) {
          mediaStreamRef.current = null;
          setMediaStream(null);
          setSelectedVideoDeviceId(nextVideoDeviceId);
          setSelectedAudioDeviceId(nextAudioDeviceId);
          setIsVideoEnabled(false);
          setIsAudioEnabled(false);
          return;
        }

        let stream: MediaStream;
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: nextVideoEnabled
              ? nextVideoDeviceId
                ? { deviceId: { exact: nextVideoDeviceId } }
                : true
              : false,
            audio: nextAudioEnabled
              ? nextAudioDeviceId
                ? { deviceId: { exact: nextAudioDeviceId } }
                : true
              : false,
          });
        } catch (initialErr) {
          console.warn("Initial getUserMedia failed:", initialErr);
          // If both were requested but failed (e.g. timeout on video), try fallback to audio only
          if (nextVideoEnabled && nextAudioEnabled) {
            console.log("Falling back to audio only...");
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: nextAudioDeviceId ? { deviceId: { exact: nextAudioDeviceId } } : true,
            });
            nextVideoEnabled = false; // We successfully got audio, so we mark video as disabled
          } else {
            throw initialErr;
          }
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const nextVideoDevices = devices.filter((device) => device.kind === "videoinput");
        const nextAudioDevices = devices.filter((device) => device.kind === "audioinput");
        
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
        setIsAudioEnabled(nextAudioEnabled && stream.getAudioTracks().length > 0);
        setIsVideoEnabled(nextVideoEnabled && stream.getVideoTracks().length > 0);
      } catch (err) {
        console.error("Camera/Mic access error:", err);
        setPermissionError(
          err instanceof Error
            ? (err.name === "AbortError" || err.message.includes("Timeout")) 
              ? "Your camera took too long to start. Try refreshing or selecting a different device."
              : err.message
            : "Camera and microphone access is required to join the meeting."
        );
      } finally {
        setIsRequesting(false);
      }
    },
    [isAudioEnabled, isVideoEnabled]
  );

  React.useEffect(() => {
    void loadPreviewStream("", "");

    return () => {
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
    void video.play().catch(() => undefined);
  }, [mediaStream]);

  React.useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const toggleAudio = () => {
    const next = !isAudioEnabled;
    void loadPreviewStream(selectedVideoDeviceId, selectedAudioDeviceId, isVideoEnabled, next);
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
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
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
    router.replace("/video-appointments");
  };

  if (isPending || !appointment || isRequesting) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 text-center bg-[var(--color-meet-black)] text-white">
        <div className="rounded-3xl border border-[#3c4043] bg-[#202124] px-5 py-4 text-center shadow-sm sm:px-6 sm:py-5">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-white" />
          <p className="mt-3 text-sm font-medium">Getting ready...</p>
        </div>
      </div>
    );
  }

  if (error || permissionError) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 text-center bg-[var(--color-meet-black)] text-white">
        <div className="max-w-md rounded-3xl border border-[#3c4043] bg-[#202124] px-5 py-5 text-center shadow-sm sm:px-6 sm:py-6">
          <p className="text-lg font-semibold">Permissions required</p>
          <p className="mt-2 text-sm text-gray-400">
            {permissionError || "Unable to load this meeting."}
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="rounded-full bg-[var(--color-meet-blue)] text-white hover:bg-blue-600"
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
        autoStart={true}
        startWithAudioEnabled={isAudioEnabled}
        startWithVideoEnabled={isVideoEnabled}
        startWithAudioSource={selectedAudioDeviceId || undefined}
        startWithVideoSource={selectedVideoDeviceId || undefined}
        onLeaveRoom={handleLeavePreview}
      />
    );
  }
  return (
    <div className="flex min-h-[100dvh] w-full flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 bg-[#202124] px-4 py-8 text-white sm:px-8">
      
      {/* Left side: Video Preview */}
      <div className="w-full max-w-3xl lg:w-[65%] flex flex-col gap-4 z-10">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#202124] transition-all duration-300">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#202124] px-4 text-center">
              <div className="h-32 w-32 rounded-full bg-[#3c4043] flex items-center justify-center mb-6">
                <VideoOff className="h-12 w-12 text-[#9aa0a6]" />
              </div>
              <p className="text-xl font-normal text-white">Camera is off</p>
            </div>
          )}
          
          {/* Controls overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex justify-center pb-8">
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                onClick={toggleAudio}
                className={`h-14 w-14 rounded-full transition-colors ${
                  isAudioEnabled
                    ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white border border-[#5f6368]"
                    : "bg-[#ea4335] hover:bg-[#ea4335]/90 text-white border-0"
                }`}
              >
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
              </Button>
              <Button
                type="button"
                onClick={toggleVideo}
                className={`h-14 w-14 rounded-full transition-colors ${
                  isVideoEnabled
                    ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white border border-[#5f6368]"
                    : "bg-[#ea4335] hover:bg-[#ea4335]/90 text-white border-0"
                }`}
              >
                {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 mt-4 px-2">
          <div className="space-y-1">
            <Select value={selectedAudioDeviceId} onValueChange={handleAudioDeviceChange}>
              <SelectTrigger className="h-10 w-full rounded-md border-0 bg-transparent hover:bg-[#3c4043] px-3 text-sm text-[#9aa0a6] focus:ring-1 focus:ring-blue-500 shadow-none">
                <Mic className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Microphone" />
              </SelectTrigger>
              <SelectContent className="border-[#3c4043] bg-[#2d2e30] text-white rounded-md">
                {audioDevices.length === 0 ? (
                  <SelectItem value="default-mic" className="py-2">Default microphone</SelectItem>
                ) : (
                  audioDevices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="py-2 focus:bg-[#4a4d51] focus:text-white">
                      {device.label || `Microphone ${index + 1}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Select value={selectedVideoDeviceId} onValueChange={handleVideoDeviceChange}>
              <SelectTrigger className="h-10 w-full rounded-md border-0 bg-transparent hover:bg-[#3c4043] px-3 text-sm text-[#9aa0a6] focus:ring-1 focus:ring-blue-500 shadow-none">
                <Video className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Camera" />
              </SelectTrigger>
              <SelectContent className="border-[#3c4043] bg-[#2d2e30] text-white rounded-md">
                {videoDevices.length === 0 ? (
                  <SelectItem value="default-camera" className="py-2">Default camera</SelectItem>
                ) : (
                  videoDevices.map((device, index) => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="py-2 focus:bg-[#4a4d51] focus:text-white">
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
      <div className="flex w-full max-w-sm flex-col items-center text-center lg:w-[35%] lg:items-center z-10 p-4">
        <h1 className="text-3xl sm:text-[36px] font-normal text-white mb-2 tracking-tight">Ready to join?</h1>
        <p className="text-[#9aa0a6] text-base mb-8 font-normal">
          Meeting with <span className="text-white font-medium">{meetingWithLabel}</span>
        </p>
        
        <div className="flex flex-row gap-3 w-full justify-center">
          <Button
            onClick={handleJoin}
            className="h-12 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-6 text-[14px] font-medium transition-colors border-0"
          >
            Join now
          </Button>
          <Button
            onClick={handleLeavePreview}
            variant="outline"
            className="h-12 rounded-full border-gray-600 bg-transparent hover:bg-gray-800 text-[#8ab4f8] hover:text-[#aecbfa] px-6 text-[14px] font-medium transition-colors"
          >
            Return
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-[#9aa0a6] w-full flex flex-col items-center gap-2">
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

