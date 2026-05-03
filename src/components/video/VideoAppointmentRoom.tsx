"use client";

// Ã¢Å“â€¦ Video Appointment Room Component with WebSocket Integration
// This component provides a complete video appointment interface using OpenVidu with real-time WebSocket updates

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  CircleDot,
  CheckCircle,
  Loader2,
  Settings,
  Users,
  MessageSquare,
  FileText,
  CreditCard,
  Calendar,
  Clock,
  User,
  UserCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Pen,
  Mic as MicIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoChat } from "./VideoChat";
import { WaitingRoom } from "./WaitingRoom";
import { MedicalNotes } from "./MedicalNotes";
import { CallQualityIndicator } from "./CallQualityIndicator";
import { ScreenAnnotation } from "./ScreenAnnotation";
import { CallTranscription } from "./CallTranscription";
import { EnhancedRecordingControls } from "./EnhancedRecordingControls";
import { EnhancedParticipantControls } from "./EnhancedParticipantControls";
import { UserVideoComponent } from "./UserVideoComponent";
import {
  getAppointmentDateTimeValue,
  formatDateInIST,
  formatTimeInIST,
  getAppointmentStatusBadgeLabel,
  getVideoSessionDecision,
  getAppointmentServiceLabel,
  getVideoAppointmentFee,
} from "@/lib/utils/appointmentUtils";
import {
  useVideoCall,
  useVideoCallControls,
  useVideoAppointment,
} from "@/hooks/query/useVideoAppointments";
import { useAppointmentServices, useCompleteAppointment } from "@/hooks/query/useAppointments";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import { useAuth } from "@/hooks/auth/useAuth";
import { showErrorToast, showInfoToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";
import { normalizeOpenViduServerUrl, resolveVideoDisplayName, type OpenViduAPI } from "@/lib/video/openvidu";
import type { ParticipantInfo } from "@/lib/video/openvidu";

interface VideoAppointmentRoomProps {
  appointment: VideoAppointment;
  onEndCall?: () => void;
  onLeaveRoom?: () => void;
  autoStart?: boolean;
  startWithAudioEnabled?: boolean;
  startWithVideoEnabled?: boolean;
  startWithAudioSource?: string | undefined;
  startWithVideoSource?: string | undefined;
}

export function VideoAppointmentRoom({
  appointment,
  onEndCall,
  onLeaveRoom,
  autoStart = false,
  startWithAudioEnabled = true,
  startWithVideoEnabled = true,
  startWithAudioSource,
  startWithVideoSource,
}: VideoAppointmentRoomProps) {
  const { user } = useAuth();
  const completeAppointmentMutation = useCompleteAppointment();
  const { data: appointmentServices = [] } = useAppointmentServices();
  const {
    startCall,
    endCall,
    isInCall,
    publisher,
    subscribers,
  } = useVideoCall();
  const { getCallControls } = useVideoCallControls();
  const {
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    subscribeToConsultationEvents,
    subscribeToChatMessages,
    subscribeToWaitingRoom,
    subscribeToMedicalNotes,
    subscribeToCallQuality,
    subscribeToAnnotations,
    subscribeToTranscription,
    sendParticipantJoined,
    sendParticipantLeft,
    sendRecordingStarted,
    sendRecordingStopped,
    isConnected,
  } = useVideoAppointmentWebSocket();

  // const videoContainerRef = useRef<HTMLDivElement>(null); // No longer needed
  const [call, setCall] = useState<OpenViduAPI | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "notes" | "participants">("chat");
  const autoStartTriggeredRef = useRef(false);
  const startCallInFlightRef = useRef(false);
  const callRef = useRef<OpenViduAPI | null>(null);
  const isMountedRef = useRef(true);
  const [hasConsultationStarted, setHasConsultationStarted] = useState(false);
  const resolvedAppointmentId = String(appointment.appointmentId || appointment.id || "");
  const currentUserId = user?.id ?? null;
  const {
    data: liveAppointmentQuery,
    isPending: isLiveAppointmentPending,
    error: liveAppointmentError,
  } = useVideoAppointment(resolvedAppointmentId);
  const liveAppointmentSource = React.useMemo(
    () => (liveAppointmentQuery as any)?.appointment || (liveAppointmentQuery as any)?.data || null,
    [liveAppointmentQuery]
  );
  const shouldUseFallbackAppointment = React.useMemo(() => {
    if (liveAppointmentSource) return false;
    if (!appointment) return false;

    const statusCode = liveAppointmentError && typeof liveAppointmentError === "object"
      ? (liveAppointmentError as { statusCode?: unknown }).statusCode
      : undefined;
    if (statusCode === 404) return true;

    if (liveAppointmentError === null || liveAppointmentError === undefined) return true;

    return false;
  }, [appointment, liveAppointmentError, liveAppointmentSource]);
  const latestAppointment = React.useMemo(() => {
    if (liveAppointmentSource) {
      return liveAppointmentSource;
    }

    if (shouldUseFallbackAppointment) {
      return appointment;
    }

    return null;
  }, [appointment, liveAppointmentSource, shouldUseFallbackAppointment]);
  const serviceLabel = React.useMemo(
    () => getAppointmentServiceLabel(latestAppointment, appointmentServices as any[]),
    [appointmentServices, latestAppointment]
  );
  const serviceFee = React.useMemo(
    () => getVideoAppointmentFee(latestAppointment, appointmentServices as any[]),
    [appointmentServices, latestAppointment]
  );
  const videoSessionDecision = React.useMemo(
    () => getVideoSessionDecision(latestAppointment),
    [latestAppointment]
  );
  const openViduHost = normalizeOpenViduServerUrl(APP_CONFIG.VIDEO.OPENVIDU_URL);
  
  // Role-based access
  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'ASSISTANT_DOCTOR';
  const isPatient = user?.role === 'PATIENT';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'CLINIC_ADMIN';
  // canRecord: only doctors and admins can initiate recordings
  const canRecord = isDoctor || isAdmin;
  // canEndForAll: doctors and admins can end the session for everyone; patients only leave
  const canEndForAll = isDoctor || isAdmin;

  // âœ… Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeParticipants = subscribeToParticipantEvents((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        if (data.action === "participant_joined" && data.participant) {
          const participantData = data.participant;
          const participant: ParticipantInfo = {
            connectionId: participantData.userId,
            data: JSON.stringify(participantData),
            role: participantData.role || 'participant',
            userId: participantData.userId,
            displayName: participantData.displayName,
          };
          setParticipants((prev) => {
            if (prev.some(p => p.userId === participant.userId)) return prev;
            return [...prev, participant];
          });
          showInfoToast("Participant joined", {
            id: TOAST_IDS.VIDEO.JOIN,
            description: `${participantData.displayName} joined the call`,
          });
        } else if (data.action === "participant_left" && data.participant) {
          const participantData = data.participant;
          setParticipants((prev) =>
            prev.filter((p) => (p.userId || p.connectionId) !== participantData.userId)
          );
          showInfoToast("Participant left", {
            id: TOAST_IDS.VIDEO.END,
            description: `${participantData.displayName} left the call`,
          });
        }
      }
    });

    const unsubscribeRecording = subscribeToRecordingEvents((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        if (data.action === "recording_started") {
          setIsRecording(true);
          showSuccessToast("Recording started", {
            id: TOAST_IDS.VIDEO.JOIN,
            description: "Video recording has started",
          });
        } else if (data.action === "recording_stopped") {
          setIsRecording(false);
          showInfoToast("Recording stopped", {
            id: TOAST_IDS.VIDEO.END,
            description: "Video recording has stopped",
          });
        }
      }
    });

    const unsubscribeConsultation = subscribeToConsultationEvents((data) => {
      if (data.appointmentId !== resolvedAppointmentId) {
        return;
      }

      const eventType = String(
        (data as { eventType?: unknown }).eventType ||
          (data as { type?: unknown }).type ||
          (data as { action?: unknown }).action ||
          ""
      ).toLowerCase();

      if (eventType.includes("started")) {
        setHasConsultationStarted(true);
      }

      if (eventType.includes("ended")) {
        setHasConsultationStarted(false);
      }
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeRecording();
      unsubscribeConsultation();
    };
  }, [
    resolvedAppointmentId,
    isConnected,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    subscribeToConsultationEvents,
  ]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeChat = subscribeToChatMessages((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        // Chat component handles its own state updates via WebSocket
        // This subscription ensures we're listening to real-time messages
      }
    });

    const unsubscribeWaitingRoom = subscribeToWaitingRoom((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        // Waiting room component handles its own state updates
        // This ensures real-time queue updates
      }
    });

    const unsubscribeNotes = subscribeToMedicalNotes((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        // Medical notes component handles its own state updates
        // This ensures real-time note synchronization
      }
    });

    return () => {
      unsubscribeChat();
      unsubscribeWaitingRoom();
      unsubscribeNotes();
    };
  }, [
    resolvedAppointmentId,
    isConnected,
    subscribeToChatMessages,
    subscribeToWaitingRoom,
    subscribeToMedicalNotes,
  ]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeQuality = subscribeToCallQuality((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        // Call quality component handles its own state updates
        // This ensures real-time quality warnings
      }
    });

    const unsubscribeAnnotations = subscribeToAnnotations((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        // Screen annotation component handles its own state updates
        // This ensures real-time annotation synchronization
      }
    });

    const unsubscribeTranscription = subscribeToTranscription((data) => {
      if (data.appointmentId === resolvedAppointmentId) {
        // Call transcription component handles its own state updates
        // This ensures real-time transcription segments
      }
    });

    return () => {
      unsubscribeQuality();
      unsubscribeAnnotations();
      unsubscribeTranscription();
    };
  }, [
    resolvedAppointmentId,
    isConnected,
    subscribeToCallQuality,
    subscribeToAnnotations,
    subscribeToTranscription,
  ]);

  // Ã¢Å“â€¦ Start video call
  const handleStartCall = useCallback(async () => {
    if (startCallInFlightRef.current || call) {
      return;
    }

    startCallInFlightRef.current = true;
    try {
      if (!user?.id) {
        throw new Error("User session is not ready. Please try joining again.");
      }
      setIsConnecting(true);

      if (!latestAppointment) {
        throw new Error("Unable to verify the latest appointment status. Please try again.");
      }

      if (videoSessionDecision.blockedReason) {
        throw new Error(videoSessionDecision.blockedReason);
      }

      const userInfo = {
        userId: user.id,
        displayName: resolveVideoDisplayName(user),
        email: user?.email || "",
        role: user?.role || "patient",
      };

      // Start call without container - React handles rendering
      const videoCall = await startCall(
        { ...latestAppointment, appointmentId: resolvedAppointmentId },
        userInfo,
        {
          publishAudio: startWithAudioEnabled,
          publishVideo: startWithVideoEnabled,
          audioSource: startWithAudioSource || true,
          videoSource: startWithVideoSource || true,
        }
      );
      if (!isMountedRef.current) {
        await videoCall.dispose().catch(() => undefined);
        return;
      }
      callRef.current = videoCall;
      setCall(videoCall);

      // Send WebSocket event for participant joined
      sendParticipantJoined(resolvedAppointmentId, {
        userId: userInfo.userId,
        displayName: userInfo.displayName || resolveVideoDisplayName(user),
        role: userInfo.role || user?.role || 'patient',
      });

      showSuccessToast("Connected to video appointment", { id: TOAST_IDS.VIDEO.JOIN });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to connect to video call", {
        id: TOAST_IDS.VIDEO.ERROR,
      });
    } finally {
      startCallInFlightRef.current = false;
      setIsConnecting(false);
    }
  }, [call, latestAppointment, resolvedAppointmentId, sendParticipantJoined, startCall, user, videoSessionDecision.blockedReason]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      const currentCall = callRef.current;
      callRef.current = null;
      if (currentCall) {
        void currentCall.dispose().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    autoStartTriggeredRef.current = false;
    setHasConsultationStarted(false);
  }, [resolvedAppointmentId]);

  useEffect(() => {
    if (!autoStart || autoStartTriggeredRef.current || call || isConnecting || !currentUserId || isLiveAppointmentPending) return;
    autoStartTriggeredRef.current = true;
    void handleStartCall().catch(() => {
      autoStartTriggeredRef.current = false;
    });
  }, [autoStart, call, currentUserId, handleStartCall, isConnecting, isLiveAppointmentPending]);

  useEffect(() => {
    if (
      call ||
      isConnecting ||
      !currentUserId ||
      isLiveAppointmentPending ||
      autoStartTriggeredRef.current
    ) {
      return;
    }

    if (!hasConsultationStarted && videoSessionDecision.action !== "resume") {
      return;
    }

    autoStartTriggeredRef.current = true;
    void handleStartCall().catch(() => {
      autoStartTriggeredRef.current = false;
    });
  }, [
    call,
    handleStartCall,
    hasConsultationStarted,
    isConnecting,
    isLiveAppointmentPending,
    currentUserId,
    videoSessionDecision.action,
  ]);

  // Ã¢Å“â€¦ End video call
  const handleEndCall = async (options?: { skipToast?: boolean }) => {
    try {
      if (call) {
        await endCall(resolvedAppointmentId);
        setCall(null);
        callRef.current = null;
      }

      // Send WebSocket event for participant left
      sendParticipantLeft(resolvedAppointmentId, {
        userId: currentUserId ?? "",
        displayName: resolveVideoDisplayName(user),
        role: user?.role || "patient",
      });

      if (onEndCall) {
        onEndCall();
      }

      if (!options?.skipToast) {
        showSuccessToast("Call ended", { id: TOAST_IDS.VIDEO.END });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const handleCompleteConsultation = useCallback(async () => {
    try {
      await completeAppointmentMutation.mutateAsync({
        id: resolvedAppointmentId,
        data: {},
      });
      await handleEndCall({ skipToast: true });
      showSuccessToast("Consultation completed", { id: TOAST_IDS.VIDEO.END });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  }, [resolvedAppointmentId, completeAppointmentMutation, handleEndCall]);

  // Ã¢Å“â€¦ Leave room
  const handleLeaveRoom = () => {
    if (call) {
      call.dispose();
      setCall(null);
      callRef.current = null;
    }

    // Send WebSocket event for participant left
      sendParticipantLeft(resolvedAppointmentId, {
        userId: currentUserId ?? "",
        displayName: resolveVideoDisplayName(user),
        role: user?.role || "patient",
      });

    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

  // Ã¢Å“â€¦ Get call controls
  const controls = call ? getCallControls(call) : null;

  useEffect(() => {
    if (!call) {
      setIsAudioMuted(false);
      setIsVideoMuted(false);
      return;
    }

    setIsAudioMuted(call.isAudioMuted());
    setIsVideoMuted(call.isVideoMuted());
  }, [call]);

  const appointmentStartDate = getAppointmentDateTimeValue(appointment);
  const appointmentEndDate = appointment.endTime ? new Date(appointment.endTime) : null;
  const appointmentDateLabel = appointmentStartDate
    ? formatDateInIST(appointmentStartDate, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })
    : "Date pending";
  const appointmentTimeLabel = appointmentStartDate
    ? formatTimeInIST(appointmentStartDate, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Time pending";
  const appointmentEndLabel =
    appointmentEndDate && !Number.isNaN(appointmentEndDate.getTime())
      ? formatTimeInIST(appointmentEndDate, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "Ã¢â‚¬â€";
  const shortAppointmentId = resolvedAppointmentId.slice(-8).toUpperCase();

  // Ã¢Å“â€¦ Toggle audio
  const toggleAudio = () => {
    if (controls) {
      controls.toggleAudio();
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Ã¢Å“â€¦ Toggle video
  const toggleVideo = () => {
    if (controls) {
      const nextMuted = controls.toggleVideo();
      if (typeof nextMuted === "boolean") {
        setIsVideoMuted(nextMuted);
      } else {
        setIsVideoMuted((prev) => !prev);
      }
    }
  };

  // Ã¢Å“â€¦ Toggle recording
  const toggleRecording = () => {
    if (controls) {
      controls.toggleRecording();
      setIsRecording(!isRecording);

      // Send WebSocket event
      if (!isRecording) {
        sendRecordingStarted(resolvedAppointmentId, {
          recordingId: resolvedAppointmentId,
          status: 'starting',
        });
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    if (!controls) return;
    if (isScreenSharing) {
      try { await controls.stopScreenShare(); setIsScreenSharing(false); } catch { /* cancelled */ }
    } else {
      setIsScreenSharing(true);
      try { await controls.shareScreen(); } catch { setIsScreenSharing(false); }
    }
  };

  // Raise hand stub
  const raiseHand = () => { /* custom signaling not yet implemented */ };

  // Update participants list
  const updateParticipants = () => {
    if (call) { setParticipants(call.getParticipants()); }
    else if (controls) { setParticipants(controls.getParticipants()); }
  };

  // Call duration timer
  const _callDurationTimer = null; // placeholder for lint


  // Ã¢Å“â€¦ Update participants periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isInCall()) {
      updateParticipants();
      interval = setInterval(updateParticipants, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isInCall]);

  // Ã¢Å“â€¦ Format call duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Ã¢Å“â€¦ Get appointment status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const connectionBadgeClass = isConnected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300";
  const toggleSidePanel = (panel: "chat" | "notes" | "participants") => {
    if (showSidePanel && activePanel === panel) {
      setShowSidePanel(false);
      return;
    }

    setActivePanel(panel);
    setShowSidePanel(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="border-b border-border bg-background px-3 py-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/20 sm:h-11 sm:w-11">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">Video Appointment</h1>
                <Badge className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]", getStatusColor(latestAppointment?.status || appointment.status))}>
                  {getAppointmentStatusBadgeLabel(latestAppointment || appointment)}
                </Badge>
                <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]", connectionBadgeClass)}>
                  {isConnected ? "Live sync" : "Offline"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Live session loaded directly from the appointment link.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300 sm:text-[11px]"
                >
                  OpenVidu host: {openViduHost || "not configured"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <div className="rounded-2xl border border-border bg-muted px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Session</p>
              <p className="text-xs font-semibold text-foreground sm:text-sm">{shortAppointmentId}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Elapsed</p>
              <p className="text-xs font-semibold text-foreground sm:text-sm">{formatDuration(callDuration)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Date</p>
              <p className="text-xs font-semibold text-foreground sm:text-sm">{appointmentDateLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Time</p>
            <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">
              {appointmentTimeLabel} â€¢ {appointmentEndLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Participants</p>
            <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">{participants.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Connection</p>
            <p className={cn("mt-1 text-xs font-semibold sm:text-sm", isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {isConnected ? "Stable" : "Reconnecting"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Recording</p>
            <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">{isRecording ? "On" : "Off"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-sm sm:px-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]">Screen share</p>
            <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">{isScreenSharing ? "Active" : "Inactive"}</p>
          </div>
        </div>
      </div>

      <div className={`grid flex-1 min-h-0 gap-3 px-3 pb-3 sm:px-4 sm:pb-4 lg:gap-4 lg:p-6 ${showSidePanel ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "xl:grid-cols-1"}`}>
        {/* Main Video Area */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-slate-950 shadow-sm">
          
          {/* Dynamic Video Grid */}
          <div className="relative flex-1 overflow-hidden p-3 sm:p-4 lg:p-5">
             {isInCall() ? (
                <div className={`grid h-full w-full gap-3 sm:gap-4 ${
                  subscribers.length === 0 ? "grid-cols-1" :
                  subscribers.length === 1 ? "grid-cols-1 sm:grid-cols-2" :
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}>
                  {/* Local User (Publisher) */}
                  {publisher && (
                    <div className="relative min-h-[220px] overflow-hidden rounded-2xl border-2 border-green-500/50 sm:min-h-[260px]">
                      <UserVideoComponent streamManager={publisher} isLocal={true} />
                    </div>
                  )}
                  
                  {/* Remote Users (Subscribers) */}
                  {subscribers.map((sub: any) => (
                    <div key={sub.stream.streamId} className="relative min-h-[220px] overflow-hidden rounded-2xl border border-gray-700 sm:min-h-[260px]">
                      <UserVideoComponent streamManager={sub} isLocal={false} />
                    </div>
                  ))}
                </div>
             ) : (
                /* No Call State */
                !isConnecting && (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-3 sm:p-6">
                    <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-5 text-center shadow-sm sm:p-8">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted sm:h-16 sm:w-16">
                        <Phone className="h-7 w-7 text-foreground sm:h-8 sm:w-8" />
                      </div>
                      <h2 className="mt-4 text-xl font-semibold sm:mt-5 sm:text-2xl">Ready to Join</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                        Start the session when you're ready. The live room, chat, and notes will open together in one workspace.
                      </p>
                      <Button
                        onClick={handleStartCall}
                        size="lg"
                        className="mt-5 w-full rounded-2xl bg-emerald-500 px-6 text-white hover:bg-emerald-600 sm:mt-6 sm:w-auto"
                    >
                      <Phone className="mr-2 h-5 w-5" />
                        {videoSessionDecision.label}
                      </Button>
                    </div>
                  </div>
                )
            )}
            
            {/* Connection Status Overlay */}
            {isConnecting && (
              <div className="absolute inset-0 z-50 flex min-h-[320px] items-center justify-center bg-slate-950/85">
                <div className="rounded-3xl border border-border bg-background px-6 py-5 text-center shadow-sm">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-300" />
                  <p className="mt-3 text-sm font-medium">Starting video call...</p>
                </div>
              </div>
            )}
          </div>

          {/* Control Bar */}
          {isInCall() && (
            <div className="border-t border-border bg-background px-2 py-2 sm:px-4 sm:py-3">
              <div className="mx-auto flex max-w-full items-end gap-2 overflow-x-auto pb-1 sm:max-w-5xl sm:flex-wrap sm:justify-center sm:gap-3">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={isAudioMuted ? "destructive" : "outline"}
                    size="lg"
                    onClick={toggleAudio}
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-full border bg-background p-0 shadow-sm transition-colors",
                      isAudioMuted
                        ? "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                    )}
                    title={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
                    aria-label={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isAudioMuted ? <MicOff className="h-[22px] w-[22px]" /> : <Mic className="h-[22px] w-[22px]" />}
                  </Button>
                  <span className="text-[10px] text-muted-foreground sm:text-[11px]">Mic</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={isVideoMuted ? "destructive" : "outline"}
                    size="lg"
                    onClick={toggleVideo}
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-full border bg-background p-0 shadow-sm transition-colors",
                      isVideoMuted
                        ? "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                    )}
                    title={isVideoMuted ? "Turn camera on" : "Turn camera off"}
                    aria-label={isVideoMuted ? "Turn camera on" : "Turn camera off"}
                  >
                    {isVideoMuted ? <VideoOff className="h-[22px] w-[22px]" /> : <Video className="h-[22px] w-[22px]" />}
                  </Button>
                  <span className="text-[10px] text-muted-foreground sm:text-[11px]">Camera</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={isScreenSharing ? "default" : "outline"}
                    size="lg"
                    onClick={toggleScreenSharing}
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-full border bg-background p-0 shadow-sm transition-colors",
                      isScreenSharing
                        ? "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700/60 dark:text-blue-300 dark:hover:bg-blue-950/30"
                        : "border-slate-300 bg-background text-foreground hover:bg-muted"
                    )}
                    title={isScreenSharing ? "Stop sharing" : "Share screen"}
                    aria-label={isScreenSharing ? "Stop sharing" : "Share screen"}
                  >
                    <Monitor className="h-[22px] w-[22px]" />
                  </Button>
                  <span className="text-[10px] text-muted-foreground sm:text-[11px]">Share</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={raiseHand}
                    className="h-12 w-12 shrink-0 rounded-full border border-border bg-background p-0 text-foreground hover:bg-muted"
                    title="Raise hand"
                    aria-label="Raise hand"
                  >
                    <Hand className="h-[22px] w-[22px]" />
                  </Button>
                  <span className="text-[10px] text-muted-foreground sm:text-[11px]">Hand</span>
                </div>

                {canRecord && isRecording && (
                  <div className="flex flex-col items-center gap-1">
                    <EnhancedRecordingControls
                      appointmentId={resolvedAppointmentId}
                      isRecording={isRecording}
                      onRecordingChange={setIsRecording}
                    />
                    <span className="text-[11px] text-muted-foreground">Record</span>
                  </div>
                )}
                {canRecord && !isRecording && (
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={toggleRecording}
                      className="h-12 w-12 shrink-0 rounded-full border border-border bg-background p-0 text-foreground hover:bg-muted"
                      title="Start recording"
                      aria-label="Start recording"
                    >
                      <CircleDot className="h-[22px] w-[22px]" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground sm:text-[11px]">Record</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-1">
                  <CallQualityIndicator appointmentId={resolvedAppointmentId} showDetails={false} />
                  <span className="text-[10px] text-muted-foreground sm:text-[11px]">Quality</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={showSidePanel ? "default" : "outline"}
                    onClick={() => toggleSidePanel(activePanel)}
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-full border bg-background p-0 shadow-sm transition-colors",
                      showSidePanel
                        ? "border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700/60 dark:text-sky-300 dark:hover:bg-sky-950/30"
                        : "border-slate-300 bg-background text-foreground hover:bg-muted"
                    )}
                    title={showSidePanel ? "Hide side panel" : "Show side panel"}
                    aria-label={showSidePanel ? "Hide side panel" : "Show side panel"}
                  >
                    {showSidePanel ? <ChevronRight className="h-[22px] w-[22px]" /> : <ChevronLeft className="h-[22px] w-[22px]" />}
                  </Button>
                  <span className="text-[10px] text-muted-foreground sm:text-[11px]">Panel</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  {canEndForAll ? (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => handleEndCall()}
                      className="h-12 w-12 shrink-0 rounded-full bg-rose-600 p-0 text-white shadow-sm hover:bg-rose-700"
                      title="End session for all"
                      aria-label="End session for all"
                    >
                      <PhoneOff className="h-[22px] w-[22px]" />
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleLeaveRoom}
                      className="h-12 w-12 shrink-0 rounded-full bg-rose-600 p-0 text-white shadow-sm hover:bg-rose-700"
                      title="Leave session"
                      aria-label="Leave session"
                    >
                      <PhoneOff className="h-[22px] w-[22px]" />
                    </Button>
                  )}
                  <span className="text-[10px] text-muted-foreground sm:text-[11px]">
                    {canEndForAll ? "End" : "Leave"}
                  </span>
                </div>

                {canEndForAll && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleCompleteConsultation()}
                    disabled={completeAppointmentMutation.isPending}
                    className="h-10 shrink-0 rounded-full px-3.5"
                    title="Mark consultation as completed"
                  >
                    {completeAppointmentMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidePanel && (
        <div className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
          <Tabs value={activePanel} onValueChange={(value) => setActivePanel(value as "chat" | "notes" | "participants")} className="flex h-full min-h-0 flex-col">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-b border-border bg-background p-1">
              <TabsTrigger value="chat" className="rounded-xl">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Chat
              </TabsTrigger>
              {/* Medical notes visible to doctors/admins only */}
              {(isDoctor || isAdmin) && (
                <TabsTrigger value="notes" className="rounded-xl">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Notes
                </TabsTrigger>
              )}
              <TabsTrigger value="participants" className="rounded-xl">
                <Users className="h-4 w-4 mr-1.5" />
                People
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="m-0 flex-1 min-h-0 overflow-hidden">
              <VideoChat appointmentId={resolvedAppointmentId} className="h-full rounded-none border-0 bg-background shadow-none" />
            </TabsContent>

            {(isDoctor || isAdmin) && (
              <TabsContent value="notes" className="m-0 flex-1 min-h-0 overflow-hidden">
                <MedicalNotes appointmentId={resolvedAppointmentId} className="h-full rounded-none border-0 bg-background shadow-none" />
              </TabsContent>
            )}

            <TabsContent value="participants" className="m-0 flex-1 overflow-auto p-4">
              {/* Appointment Info */}
              <Card className="mb-4 rounded-2xl border border-border bg-background shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Appointment Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background px-3 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Date
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {appointmentStartDate
                        ? formatDateInIST(appointmentStartDate, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Date pending"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background px-3 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Time
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {appointmentStartDate
                        ? formatTimeInIST(appointmentStartDate, {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "Time pending"}
                      {" - "}
                      {appointment.endTime
                        ? formatTimeInIST(new Date(appointment.endTime), {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-"}
                    </p>
                  </div>
                  <div className="sm:col-span-2 rounded-2xl border border-border/60 bg-background px-3 py-3 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          Doctor ID
                        </div>
                        <p className="mt-2 break-all text-sm font-semibold text-foreground">
                          {appointment.doctorId}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          <UserCheck className="h-3.5 w-3.5" />
                          Patient ID
                        </div>
                        <p className="mt-2 break-all text-sm font-semibold text-foreground">
                          {appointment.patientId}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          Service
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {serviceLabel}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          <CreditCard className="h-3.5 w-3.5" />
                          Fee
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {serviceFee > 0 ? `â‚¹${serviceFee}` : "Included"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              <Card className="mb-4 rounded-2xl border border-border bg-background shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {participants.length > 0 ? (
                      participants.map((participant, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-3 py-2.5 shadow-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                            <span className="text-sm font-medium text-foreground">
                              {participant.displayName || "Unknown"}
                            </span>
                            <Badge variant="outline" className="rounded-full text-xs">
                              {participant.role}
                            </Badge>
                          </div>
                          {/* Enhanced Participant Controls - Only for doctors/admins */}
                          {(isDoctor || isAdmin) && (
                              <EnhancedParticipantControls
                                appointmentId={resolvedAppointmentId}
                                participant={participant}
                                currentUserId={currentUserId ?? ""}
                                onActionComplete={updateParticipants}
                              />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-muted py-6 text-center text-muted-foreground">
                        <Users className="mx-auto mb-2 h-8 w-8" />
                        <p className="text-sm">No participants yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Waiting Room - Only for doctors */}
              {isDoctor && (
                <Card className="mb-4 rounded-2xl border border-border bg-background shadow-sm">
                  <WaitingRoom
                    appointmentId={resolvedAppointmentId}
                    className="border-0"
                  />
                </Card>
              )}

              {/* Additional Features */}
              <Card className="mb-4 rounded-2xl border border-border bg-background shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Additional Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Tabs defaultValue="annotation" className="w-full">
                    <TabsList className="mb-2 grid h-auto w-full grid-cols-2 rounded-2xl bg-muted p-1">
                      <TabsTrigger value="annotation" className="rounded-xl">
                        <Pen className="h-4 w-4 mr-1" />
                        Annotation
                      </TabsTrigger>
                      <TabsTrigger value="transcription" className="rounded-xl">
                        <MicIcon className="h-4 w-4 mr-1" />
                        Transcript
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="annotation" className="mt-0">
                      {isScreenSharing ? (
                        <ScreenAnnotation
                          appointmentId={resolvedAppointmentId}
                          className="border-0"
                        />
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-muted py-8 text-center text-muted-foreground">
                          <Pen className="mx-auto mb-2 h-8 w-8" />
                          <p className="text-sm">Start screen sharing to enable annotation</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="transcription" className="mt-0">
                      <CallTranscription
                        appointmentId={resolvedAppointmentId}
                        className="border-0"
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="rounded-2xl border border-border bg-background shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start rounded-2xl border-border/60">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-2xl border-border/60 text-red-600 hover:text-red-700"
                    onClick={handleLeaveRoom}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Leave Room
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        )}
      </div>
    </div>
  );
}

