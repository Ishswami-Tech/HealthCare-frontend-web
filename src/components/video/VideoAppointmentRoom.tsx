"use client";

// âœ… Video Appointment Room Component with WebSocket Integration
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
import { normalizeOpenViduServerUrl, type OpenViduAPI } from "@/lib/video/openvidu";
import type { ParticipantInfo } from "@/lib/video/openvidu";

interface VideoAppointmentRoomProps {
  appointment: VideoAppointment;
  onEndCall?: () => void;
  onLeaveRoom?: () => void;
  autoStart?: boolean;
}

export function VideoAppointmentRoom({
  appointment,
  onEndCall,
  onLeaveRoom,
  autoStart = false,
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

  // ✅ Subscribe to WebSocket events
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

  // âœ… Start video call
  const handleStartCall = useCallback(async () => {
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
        displayName: user?.name || "Unknown User",
        email: user?.email || "",
        role: user?.role || "patient",
      };

      // Start call without container - React handles rendering
      const videoCall = await startCall({ ...latestAppointment, appointmentId: resolvedAppointmentId }, userInfo);
      setCall(videoCall);

      // Send WebSocket event for participant joined
      sendParticipantJoined(resolvedAppointmentId, {
        userId: userInfo.userId,
        displayName: userInfo.displayName || user?.name || 'User',
        role: userInfo.role || user?.role || 'patient',
      });

      showSuccessToast("Connected to video appointment", { id: TOAST_IDS.VIDEO.JOIN });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to connect to video call", {
        id: TOAST_IDS.VIDEO.ERROR,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [latestAppointment, resolvedAppointmentId, sendParticipantJoined, startCall, user, videoSessionDecision.blockedReason]);

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

  // âœ… End video call
  const handleEndCall = async (options?: { skipToast?: boolean }) => {
    try {
      if (call) {
        await endCall(resolvedAppointmentId);
        setCall(null);
      }

      // Send WebSocket event for participant left
      sendParticipantLeft(resolvedAppointmentId, {
        userId: currentUserId ?? "",
        displayName: user?.name || "Unknown User",
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

  // âœ… Leave room
  const handleLeaveRoom = () => {
    if (call) {
      call.dispose();
      setCall(null);
    }

    // Send WebSocket event for participant left
    sendParticipantLeft(resolvedAppointmentId, {
      userId: currentUserId ?? "",
      displayName: user?.name || "Unknown User",
      role: user?.role || "patient",
    });

    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

  // âœ… Get call controls
  const controls = call ? getCallControls(call) : null;
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
      : "â€”";
  const shortAppointmentId = resolvedAppointmentId.slice(-8).toUpperCase();

  // âœ… Toggle audio
  const toggleAudio = () => {
    if (controls) {
      controls.toggleAudio();
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // âœ… Toggle video
  const toggleVideo = () => {
    if (controls) {
      controls.toggleVideo();
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // âœ… Toggle recording
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
      } else {
        sendRecordingStopped(resolvedAppointmentId, {
          recordingId: resolvedAppointmentId,
          status: 'stopped',
        });
      }
    }
  };

  // âœ… Toggle screen sharing
  const toggleScreenSharing = () => {
    if (controls) {
      controls.shareScreen();
      setIsScreenSharing(!isScreenSharing);
    }
  };

  // âœ… Raise hand
  const raiseHand = () => {
    if (controls) {
      controls.raiseHand();
    }
  };

  // âœ… Update participants
  const updateParticipants = () => {
    if (call) {
      const currentParticipants = call.getParticipants();
      setParticipants(currentParticipants);
    } else if (controls) {
      const currentParticipants = controls.getParticipants();
      setParticipants(currentParticipants);
    }
  };

  // âœ… Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isInCall()) {
      // Use setInterval for call duration (1 second updates are fine)
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isInCall]);

  // âœ… Update participants periodically
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

  // âœ… Format call duration
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

  // âœ… Get appointment status color
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
      <div className="border-b border-border bg-background px-4 py-3 lg:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-lg shadow-emerald-500/20">
              <Phone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight">Video Appointment</h1>
                <Badge className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", getStatusColor(latestAppointment?.status || appointment.status))}>
                  {getAppointmentStatusBadgeLabel(latestAppointment || appointment)}
                </Badge>
                <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide", connectionBadgeClass)}>
                  {isConnected ? "Live sync" : "Offline"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Live session loaded directly from the appointment link.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  OpenVidu host: {openViduHost || "not configured"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-border bg-muted px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Session</p>
              <p className="text-sm font-semibold text-foreground">{shortAppointmentId}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Elapsed</p>
              <p className="text-sm font-semibold text-foreground">{formatDuration(callDuration)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Date</p>
              <p className="text-sm font-semibold text-foreground">{appointmentDateLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Time</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {appointmentTimeLabel} • {appointmentEndLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Participants</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{participants.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Connection</p>
            <p className={cn("mt-1 text-sm font-semibold", isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {isConnected ? "Stable" : "Reconnecting"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Recording</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{isRecording ? "On" : "Off"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Screen share</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{isScreenSharing ? "Active" : "Inactive"}</p>
          </div>
        </div>
      </div>

      <div className={`grid flex-1 min-h-0 gap-4 p-4 ${showSidePanel ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "xl:grid-cols-1"} xl:p-6`}>
        {/* Main Video Area */}
        <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-slate-950 shadow-sm">
          
          {/* Dynamic Video Grid */}
          <div className="relative flex-1 p-4 overflow-hidden lg:p-5">
             {isInCall() ? (
                <div className={`grid gap-4 w-full h-full ${
                  subscribers.length === 0 ? 'grid-cols-1' : 
                  subscribers.length === 1 ? 'grid-cols-2' : 
                  'grid-cols-2 md:grid-cols-3'
                }`}>
                  {/* Local User (Publisher) */}
                  {publisher && (
                    <div className="relative rounded-lg overflow-hidden border-2 border-green-500/50">
                      <UserVideoComponent streamManager={publisher} isLocal={true} />
                    </div>
                  )}
                  
                  {/* Remote Users (Subscribers) */}
                  {subscribers.map((sub: any) => (
                    <div key={sub.stream.streamId} className="relative rounded-lg overflow-hidden border border-gray-700">
                      <UserVideoComponent streamManager={sub} isLocal={false} />
                    </div>
                  ))}
                </div>
             ) : (
                /* No Call State */
                !isConnecting && (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-6">
                    <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-8 text-center shadow-sm">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <Phone className="h-8 w-8 text-foreground" />
                      </div>
                      <h2 className="mt-5 text-2xl font-semibold">Ready to Join</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                        Start the session when you're ready. The live room, chat, and notes will open together in one workspace.
                      </p>
                      <Button
                        onClick={handleStartCall}
                        size="lg"
                        className="mt-6 rounded-2xl bg-emerald-500 px-6 text-white hover:bg-emerald-600"
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
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 min-h-[400px]">
                <div className="rounded-3xl border border-border bg-background px-6 py-5 text-center shadow-sm">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-300" />
                  <p className="mt-3 text-sm font-medium">Connecting to video call...</p>
                </div>
              </div>
            )}
          </div>

          {/* Control Bar */}
          {isInCall() && (
            <div className="border-t border-border bg-background px-3 py-3 sm:px-4">
              <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-center gap-2 sm:gap-3">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={isAudioMuted ? "destructive" : "outline"}
                    size="lg"
                    onClick={toggleAudio}
                    className="h-11 w-11 rounded-full p-0"
                    title={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <span className="text-[11px] text-muted-foreground">Mic</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={isVideoMuted ? "destructive" : "outline"}
                    size="lg"
                    onClick={toggleVideo}
                    className="h-11 w-11 rounded-full p-0"
                    title={isVideoMuted ? "Turn camera on" : "Turn camera off"}
                  >
                    {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                  <span className="text-[11px] text-muted-foreground">Camera</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant={isScreenSharing ? "default" : "outline"}
                    size="lg"
                    onClick={toggleScreenSharing}
                    className="h-11 w-11 rounded-full p-0"
                    title={isScreenSharing ? "Stop sharing" : "Share screen"}
                  >
                    <Monitor className="h-5 w-5" />
                  </Button>
                  <span className="text-[11px] text-muted-foreground">Share</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={raiseHand}
                    className="h-11 w-11 rounded-full p-0"
                    title="Raise hand"
                  >
                    <Hand className="h-5 w-5" />
                  </Button>
                  <span className="text-[11px] text-muted-foreground">Hand</span>
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
                      className="h-11 w-11 rounded-full p-0"
                      title="Start recording"
                    >
                      <CircleDot className="h-5 w-5" />
                    </Button>
                    <span className="text-[11px] text-muted-foreground">Record</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-1">
                  <CallQualityIndicator appointmentId={resolvedAppointmentId} showDetails={false} />
                  <span className="text-[11px] text-muted-foreground">Quality</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="outline"
                    onClick={() => toggleSidePanel(activePanel)}
                    className="h-11 w-11 rounded-full p-0"
                    title={showSidePanel ? "Hide side panel" : "Show side panel"}
                  >
                    {showSidePanel ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                  </Button>
                  <span className="text-[11px] text-muted-foreground">Panel</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  {canEndForAll ? (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => handleEndCall()}
                      className="h-11 w-11 rounded-full p-0"
                      title="End session for all"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleLeaveRoom}
                      className="h-11 w-11 rounded-full p-0"
                      title="Leave session"
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {canEndForAll ? "End" : "Leave"}
                  </span>
                </div>

                {canEndForAll && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleCompleteConsultation()}
                    disabled={completeAppointmentMutation.isPending}
                    className="h-11 rounded-full px-4"
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
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-b border-border bg-background p-1.5">
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
                          {serviceFee > 0 ? `₹${serviceFee}` : "Included"}
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

