
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Info,
  Loader2,
  Phone,
  XCircle,
  Search,
  UserPlus,
  MoreVertical,
  ChevronDown,
  WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/utils/use-toast";
import { useVideoCall, useVideoCallControls } from "@/hooks/query/useVideoAppointments";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  getAppointmentDateTimeValue, 
  formatDateInIST, 
  formatTimeInIST,
} from "@/lib/utils/appointmentUtils";
import { resolveVideoDisplayName, ParticipantInfo, OpenViduAPI } from "@/lib/video/openvidu";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { GridLayout } from "./layouts/GridLayout";
import { SpeakerLayout } from "./layouts/SpeakerLayout";
import { MeetControlBar } from "./components/MeetControlBar";
import { VideoChat } from "../VideoChat";
import { MedicalNotes } from "../MedicalNotes";
import { EnhancedParticipantControls } from "../EnhancedParticipantControls";
import { VideoAppointment } from "@/hooks/query/useVideoAppointments";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useVideoAppointmentTabOwnership } from "@/hooks/utils/useVideoAppointmentTabOwnership";
import { getAvatarTone } from "@/lib/utils/avatar-colors";
import { withTimeout } from "@/lib/video/openvidu";
import {
  useUpdateVirtualBackground,
  useVirtualBackgroundPresets,
  useVirtualBackgroundSettings,
} from "@/hooks/query/useVideoAppointments";
import APP_CONFIG from "@/lib/config/config";

interface VideoAppointmentRoomProps {
  appointment: VideoAppointment;
  onLeaveRoom?: () => void;
  startWithAudioEnabled?: boolean;
  startWithVideoEnabled?: boolean;
  initialMediaStream?: MediaStream | null;
}

type VirtualBackgroundMode = "none" | "blur-light" | "blur-medium" | "blur-strong";

const VIRTUAL_BACKGROUND_FALLBACKS: Array<{
  id: VirtualBackgroundMode;
  label: string;
  blurIntensity: number;
}> = [
  { id: "none", label: "Off", blurIntensity: 0 },
  { id: "blur-light", label: "Light blur", blurIntensity: 30 },
  { id: "blur-medium", label: "Medium blur", blurIntensity: 60 },
  { id: "blur-strong", label: "Strong blur", blurIntensity: 85 },
];

const END_CALL_TIMEOUT_MS = 10000;

export default function VideoAppointmentRoom({
  appointment,
  onLeaveRoom,
  startWithAudioEnabled = true,
  startWithVideoEnabled = true,
  initialMediaStream = null,
}: VideoAppointmentRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const resolvedAppointmentId = appointment.appointmentId;
  const meetingLink = `${(
    APP_CONFIG.APP.URL?.replace(/\/+$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "")
  )}/video-appointments/meet/${encodeURIComponent(resolvedAppointmentId)}`;
  const currentUserId = user?.id;
  const isDoctor = user?.role === "DOCTOR" || user?.role === "ASSISTANT_DOCTOR";
  const isAdmin = user?.role === "CLINIC_ADMIN" || user?.role === "SUPER_ADMIN";

  // Use the refined video hooks
  const {
    startCall,
    endCall,
    isInCall,
    publisher,
    subscribers,
    getCurrentCall,
  } = useVideoCall();
  const { getCallControls } = useVideoCallControls();
  
  const { 
    sendParticipantLeft,
    sendRecordingStarted,
    sendRecordingStopped,
    subscribeToVirtualBackground,
    isConnected
  } = useVideoAppointmentWebSocket();
  const {
    isOwnershipLost,
    claimOwnership,
    releaseOwnership,
  } = useVideoAppointmentTabOwnership(resolvedAppointmentId);
  const { data: virtualBackgroundSettings } = useVirtualBackgroundSettings(resolvedAppointmentId);
  const { data: virtualBackgroundPresets = [] } = useVirtualBackgroundPresets();
  const updateVirtualBackgroundMutation = useUpdateVirtualBackground();

  // Component local state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isAudioActionBusy, setIsAudioActionBusy] = useState(false);
  const [isVideoActionBusy, setIsVideoActionBusy] = useState(false);
  const [isScreenShareActionBusy, setIsScreenShareActionBusy] = useState(false);
  const [isRecordingActionBusy, setIsRecordingActionBusy] = useState(false);
  const [isHandRaiseActionBusy, setIsHandRaiseActionBusy] = useState(false);
  const [isEndCallActionBusy, setIsEndCallActionBusy] = useState(false);
  const [call, setCall] = useState<OpenViduAPI | null>(null);
  const callRef = useRef<OpenViduAPI | null>(null);
  const hasAutoStartedRef = useRef(false);
  const [sessionMovedMessage, setSessionMovedMessage] = useState<string | null>(null);
  const [virtualBackgroundMode, setVirtualBackgroundMode] = useState<VirtualBackgroundMode>("none");
  const [virtualBackgroundBlurIntensity, setVirtualBackgroundBlurIntensity] = useState(0);

  // Handle incoming signals and audio volume
  useEffect(() => {
    const handleAudioVolumeChange = (event: any) => {
      // OpenVidu sends volume from 0 to 100
      const { value } = event.detail || {};
      if (value > 5) { // threshold
        setIsLocalSpeaking(true);
      } else {
        setIsLocalSpeaking(false);
      }
    };

    window.addEventListener('openvidu-audio-volume-change', handleAudioVolumeChange);

    const session = getCurrentCall()?.getSession();
    if (!session) return;

    const handleHandRaiseSignal = (event: any) => {
      const { raised } = JSON.parse(event.data);
      const connectionId = event.from.connectionId;
      
      setRaisedHands(prev => {
        const next = new Set(prev);
        if (raised) {
          next.add(connectionId);
        } else {
          next.delete(connectionId);
        }
        return next;
      });
    };

    session.on('signal:hand-raise', handleHandRaiseSignal);
    return () => {
      window.removeEventListener('openvidu-audio-volume-change', handleAudioVolumeChange);
      session.off('signal:hand-raise', handleHandRaiseSignal);
    };
  }, [getCurrentCall, call]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToVirtualBackground((data) => {
      if (data.consultationId !== appointment.appointmentId) return;
      if (data.userId && data.userId !== currentUserId) return;

      if (data.enabled === false || data.type === "none") {
        setVirtualBackgroundMode("none");
        setVirtualBackgroundBlurIntensity(0);
        return;
      }

      const intensity = typeof data.blurIntensity === "number" ? data.blurIntensity : 60;
      const mode =
        intensity >= 75 ? "blur-strong" : intensity >= 45 ? "blur-medium" : "blur-light";
      setVirtualBackgroundMode(mode);
      setVirtualBackgroundBlurIntensity(intensity);
    });

    return unsubscribe;
  }, [appointment.appointmentId, currentUserId, isConnected, subscribeToVirtualBackground]);

  const [layout, setLayout] = useState<"grid" | "speaker">("grid");
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "notes" | "participants">("chat");
  const [activeAudioDeviceId, setActiveAudioDeviceId] = useState<string | null>(null);
  const [activeVideoDeviceId, setActiveVideoDeviceId] = useState<string | null>(null);
  const [connectionIssue, setConnectionIssue] = useState<null | {
    severity: "warning" | "error";
    title: string;
    description: string;
  }>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  
  const filteredParticipants = participants.filter((p: ParticipantInfo) => 
    p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const participantsSignatureRef = useRef("");

  const showSuccessToast = (title: string, options?: any) => {
    toast({
      title,
      description: options?.description,
      variant: "default",
      id: options?.id,
    });
  };

  const showErrorToast = (error: any, options?: any) => {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive",
      id: options?.id,
    });
  };

  const resolveVirtualBackgroundChoice = (
    mode: VirtualBackgroundMode
  ): { enabled: boolean; type: "blur" | "image" | "video" | "none"; blurIntensity: number } => {
    switch (mode) {
      case "blur-light":
        return { enabled: true, type: "blur", blurIntensity: 30 };
      case "blur-medium":
        return { enabled: true, type: "blur", blurIntensity: 60 };
      case "blur-strong":
        return { enabled: true, type: "blur", blurIntensity: 85 };
      case "none":
      default:
        return { enabled: false, type: "none", blurIntensity: 0 };
    }
  };

  const cycleVirtualBackground = async () => {
    const currentIndex = VIRTUAL_BACKGROUND_FALLBACKS.findIndex((item) => item.id === virtualBackgroundMode);
    const nextMode = VIRTUAL_BACKGROUND_FALLBACKS[(currentIndex + 1) % VIRTUAL_BACKGROUND_FALLBACKS.length]?.id || "none";
    const nextChoice = resolveVirtualBackgroundChoice(nextMode);

    setVirtualBackgroundMode(nextMode);
    setVirtualBackgroundBlurIntensity(nextChoice.blurIntensity);

    try {
      if (call) {
        if (nextChoice.enabled) {
          await call.applyVirtualBackground(nextChoice);
        } else {
          await call.clearVirtualBackground();
        }
      }

      await updateVirtualBackgroundMutation.mutateAsync({
        appointmentId: resolvedAppointmentId,
        data: nextChoice,
      });
      toast({
        title: "Background updated",
        description:
          nextMode === "none"
            ? "Background effects are off"
            : `Applied ${VIRTUAL_BACKGROUND_FALLBACKS.find((item) => item.id === nextMode)?.label || "blur"}`,
      });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  useEffect(() => {
    if (!virtualBackgroundSettings) return;

    const mode =
      !virtualBackgroundSettings.enabled || virtualBackgroundSettings.type === "none"
        ? "none"
        : virtualBackgroundSettings.type === "blur"
          ? virtualBackgroundSettings.blurIntensity && virtualBackgroundSettings.blurIntensity >= 75
            ? "blur-strong"
            : virtualBackgroundSettings.blurIntensity && virtualBackgroundSettings.blurIntensity >= 45
              ? "blur-medium"
              : "blur-light"
          : "none";

    const normalizedMode = mode as VirtualBackgroundMode;
    setVirtualBackgroundMode(normalizedMode);
    if (virtualBackgroundSettings.blurIntensity !== undefined) {
      setVirtualBackgroundBlurIntensity(virtualBackgroundSettings.blurIntensity);
    }
  }, [virtualBackgroundSettings]);

  useEffect(() => {
    if (virtualBackgroundPresets.length === 0) return;
    if (virtualBackgroundSettings) return;

    const defaultPreset = virtualBackgroundPresets.find((preset) => preset.isDefault);
    if (defaultPreset?.type === "blur" && defaultPreset.blurIntensity !== undefined) {
      setVirtualBackgroundMode(
        defaultPreset.blurIntensity >= 75
          ? "blur-strong"
          : defaultPreset.blurIntensity >= 45
            ? "blur-medium"
            : "blur-light"
      );
      setVirtualBackgroundBlurIntensity(defaultPreset.blurIntensity);
    }
  }, [virtualBackgroundPresets, virtualBackgroundSettings]);

  useEffect(() => {
    if (!call) {
      return;
    }

    const applyToPublisher = async () => {
      if (!virtualBackgroundSettings || !virtualBackgroundSettings.enabled || virtualBackgroundSettings.type === "none") {
        await call.clearVirtualBackground();
        return;
      }

      await call.applyVirtualBackground({
        enabled: true,
        type: virtualBackgroundSettings.type,
        ...(virtualBackgroundSettings.blurIntensity !== undefined
          ? { blurIntensity: virtualBackgroundSettings.blurIntensity }
          : {}),
        ...(virtualBackgroundSettings.imageUrl ? { imageUrl: virtualBackgroundSettings.imageUrl } : {}),
        ...(virtualBackgroundSettings.videoUrl ? { videoUrl: virtualBackgroundSettings.videoUrl } : {}),
      });
    };

    void applyToPublisher().catch((error) => {
      console.warn("[VIDEO] Failed to apply virtual background:", error);
    });
  }, [call, virtualBackgroundSettings]);

  useEffect(() => {
    if (!call || virtualBackgroundSettings) {
      return;
    }

    const applyDefaultPreset = async () => {
      const choice = resolveVirtualBackgroundChoice(virtualBackgroundMode);
      if (choice.enabled) {
        await call.applyVirtualBackground(choice);
      } else {
        await call.clearVirtualBackground();
      }
    };

    void applyDefaultPreset().catch((error) => {
      console.warn("[VIDEO] Failed to apply default virtual background:", error);
    });
  }, [call, virtualBackgroundMode, virtualBackgroundSettings]);

  useEffect(() => {
    const handleSessionDisconnected = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: string }>).detail;
      setConnectionIssue({
        severity: "error",
        title: "Connection lost",
        description: detail?.reason
          ? `OpenVidu disconnected (${detail.reason}).`
          : "OpenVidu disconnected. Reconnect to continue the consultation.",
      });
      setIsConnecting(false);
    };

    const handleSessionException = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setConnectionIssue({
        severity: "warning",
        title: "Connection unstable",
        description: detail?.message
          ? `OpenVidu reported a transport issue: ${detail.message}`
          : "OpenVidu reported a transport issue. The room will try to recover.",
      });
    };

    const handleLocalConnectionCreated = () => {
      setConnectionIssue(null);
    };

    window.addEventListener("openvidu-session-disconnected", handleSessionDisconnected as EventListener);
    window.addEventListener("openvidu-exception", handleSessionException as EventListener);
    window.addEventListener("openvidu-connection-created", handleLocalConnectionCreated as EventListener);

    return () => {
      window.removeEventListener("openvidu-session-disconnected", handleSessionDisconnected as EventListener);
      window.removeEventListener("openvidu-exception", handleSessionException as EventListener);
      window.removeEventListener("openvidu-connection-created", handleLocalConnectionCreated as EventListener);
    };
  }, []);

  const handleStartCall = async () => {
    if (callRef.current || isConnecting) {
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionIssue(null);
      claimOwnership();
      setSessionMovedMessage(null);
      const previewAudioTrack = initialMediaStream?.getAudioTracks()[0]?.clone();
      const previewVideoTrack = initialMediaStream?.getVideoTracks()[0]?.clone();
      const videoCall = await startCall(
        appointment,
        {
          userId: currentUserId ?? "",
          role: user?.role || "patient",
          displayName: resolveVideoDisplayName(user),
        },
        {
          publishAudio: startWithAudioEnabled,
          publishVideo: startWithVideoEnabled,
          ...(previewAudioTrack && startWithAudioEnabled ? { audioSource: previewAudioTrack } : {}),
          ...(previewVideoTrack && startWithVideoEnabled ? { videoSource: previewVideoTrack } : {}),
        }
      );
      setConnectionIssue(null);
      setCall(videoCall);
      callRef.current = videoCall;

      // The preview stream has already been cloned into the publisher.
      // Release the original preview capture so the browser camera is owned
      // only by the active room session.
      initialMediaStream?.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore teardown errors; the session is already live.
        }
      });
      
      // Initialize active devices
      setActiveAudioDeviceId(videoCall.getActiveAudioDeviceId());
      setActiveVideoDeviceId(videoCall.getActiveVideoDeviceId());
      
      setIsConnecting(false);
      showSuccessToast("Connected to meeting", { id: TOAST_IDS.VIDEO.JOIN });
    } catch (error) {
      setIsConnecting(false);
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  useEffect(() => {
    if (isInCall() || isConnecting || sessionMovedMessage || hasAutoStartedRef.current || connectionIssue) {
      return;
    }

    hasAutoStartedRef.current = true;
    void handleStartCall();
  }, [connectionIssue, handleStartCall, isConnecting, isInCall, sessionMovedMessage]);

  const handleLeaveRoom = () => {
    const activeCall = call;
    if (activeCall) {
      releaseOwnership();
      activeCall.dispose().catch(() => undefined);
    }

    setCall(null);
    callRef.current = null;
    setConnectionIssue(null);
    initialMediaStream?.getTracks().forEach((track) => track.stop());

    sendParticipantLeft(resolvedAppointmentId, {
      userId: currentUserId ?? "",
      displayName: resolveVideoDisplayName(user),
      role: user?.role || "patient",
    });

    onLeaveRoom?.();
  };

  useEffect(() => {
    if (!isOwnershipLost) {
      return;
    }

    if (callRef.current) {
      callRef.current.dispose().catch(() => undefined);
      callRef.current = null;
    }

    setCall(null);
    setIsConnecting(false);
    setSessionMovedMessage("This session is now active in another tab.");
  }, [isOwnershipLost]);

  useEffect(() => {
    return () => {
      releaseOwnership();
    };
  }, [releaseOwnership]);

  const controls = call ? getCallControls(call) : null;

  // Sync mute state from publisher whenever OpenVidu fires property-changed event
  useEffect(() => {
    const handlePropertyChange = (e: any) => {
      const { property, value } = e.detail || {};
      if (property === 'audioActive') setIsAudioMuted(!value);
      if (property === 'videoActive') setIsVideoMuted(!value);
    };

    window.addEventListener('openvidu-publisher-property-changed', handlePropertyChange);
    
    const handleScreenShareStarted = () => setIsScreenSharing(true);
    const handleScreenShareStopped = () => setIsScreenSharing(false);

    window.addEventListener('openvidu-screen-share-started', handleScreenShareStarted);
    window.addEventListener('openvidu-screen-share-stopped', handleScreenShareStopped);

    // Initial sync
    if (publisher) {
      setIsAudioMuted(!(publisher?.stream?.audioActive ?? true));
      setIsVideoMuted(!(publisher?.stream?.videoActive ?? true));
    } else if (call) {
      setIsAudioMuted(call.isAudioMuted());
      setIsVideoMuted(call.isVideoMuted());
    }

    return () => {
      window.removeEventListener('openvidu-publisher-property-changed', handlePropertyChange);
      window.removeEventListener('openvidu-screen-share-started', handleScreenShareStarted);
      window.removeEventListener('openvidu-screen-share-stopped', handleScreenShareStopped);
    };
  }, [publisher, call]);

  const toggleAudio = () => {
    if (!controls || isAudioActionBusy) return;
    setIsAudioActionBusy(true);
    controls.toggleAudio();
    window.setTimeout(() => setIsAudioActionBusy(false), 350);
  };

  const toggleVideo = () => {
    if (!controls || isVideoActionBusy) return;
    setIsVideoActionBusy(true);
    controls.toggleVideo();
    window.setTimeout(() => setIsVideoActionBusy(false), 350);
  };

  const toggleRecording = () => {
    if (!controls || isRecordingActionBusy) return;
    setIsRecordingActionBusy(true);
    controls.toggleRecording();
    const next = !isRecording;
    setIsRecording(next);
    if (next) {
      sendRecordingStarted(resolvedAppointmentId, { recordingId: resolvedAppointmentId, status: 'starting' });
    } else {
      sendRecordingStopped(resolvedAppointmentId, { recordingId: resolvedAppointmentId, status: 'stopped' });
    }
    window.setTimeout(() => setIsRecordingActionBusy(false), 350);
  };

  const toggleScreenSharing = async () => {
    if (!controls || isScreenShareActionBusy) return;
    setIsScreenShareActionBusy(true);
    try {
      if (isScreenSharing) {
        await controls.stopScreenShare();
      } else {
        await controls.shareScreen();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      if (!isScreenSharing) {
        setIsScreenSharing(false);
      }
    } finally {
      setIsScreenShareActionBusy(false);
    }
  };

  const toggleHandRaise = () => {
    if (isHandRaiseActionBusy) return;
    setIsHandRaiseActionBusy(true);
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    
    if (isHandRaised) {
      setRaisedHands(prev => {
        const next = new Set(prev);
        next.delete('local');
        return next;
      });
    } else {
      setRaisedHands(prev => new Set(prev).add('local'));
    }

    const session = getCurrentCall()?.getSession();
    if (session) {
      session.signal({
        data: JSON.stringify({ raised: nextState }),
        type: 'hand-raise'
      }).catch((err: any) => console.error('Error sending hand-raise signal:', err));
    }

    window.setTimeout(() => setIsHandRaiseActionBusy(false), 350);
  };

  const handleEndCall = async (options?: { skipToast?: boolean }) => {
    const activeCall = call;
    if (isEndCallActionBusy) return;
    setIsEndCallActionBusy(true);
    try {
      if (activeCall) {
        releaseOwnership();
        await withTimeout(
          endCall(resolvedAppointmentId),
          END_CALL_TIMEOUT_MS,
          "Ending the session is taking too long"
        );
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    } finally {
      if (activeCall) {
        activeCall.dispose().catch(() => undefined);
      }
      setCall(null);
      callRef.current = null;
      setConnectionIssue(null);
      initialMediaStream?.getTracks().forEach((track) => track.stop());

      if (!options?.skipToast && activeCall) {
        showSuccessToast("Call ended", { id: TOAST_IDS.VIDEO.END });
      }

      onLeaveRoom?.();
      setIsEndCallActionBusy(false);
    }
  };

  const toggleLayout = () => {
    setLayout((prev) => (prev === "grid" ? "speaker" : "grid"));
  };

  const updateParticipants = () => {
    const current = call ? call.getParticipants() : (controls ? controls.getParticipants() : []);
    const signature = current
      .map((participant) => `${participant.connectionId}:${participant.userId || ""}:${participant.displayName || ""}:${participant.role || ""}`)
      .join("|");
    if (signature !== participantsSignatureRef.current) {
      participantsSignatureRef.current = signature;
      setParticipants(current);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isInCall()) {
      // Initial update
      updateParticipants();
      
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
        updateParticipants();
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isInCall, publisher, subscribers, call]);

  useEffect(() => {
    // Also update when active state changes
    updateParticipants();
  }, [publisher, subscribers, call]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInCall()) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isInCall]);

  const toggleSidePanel = (panel: "chat" | "notes" | "participants") => {
    if (showSidePanel && activePanel === panel) {
      setShowSidePanel(false);
      return;
    }

    setActivePanel(panel);
    setShowSidePanel(true);
  };

  const appointmentStartDate = getAppointmentDateTimeValue(appointment);
  const appointmentDateLabel = appointmentStartDate ? formatDateInIST(appointmentStartDate, { day: "2-digit", month: "short", year: "numeric" }) : "Date pending";
  const appointmentTimeLabel = appointmentStartDate ? formatTimeInIST(appointmentStartDate, { hour: "2-digit", minute: "2-digit", hour12: true }) : "Time pending";

  if (sessionMovedMessage) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center bg-background px-4 py-8 text-foreground dark:bg-meet-black dark:text-white">
        <div className="max-w-lg rounded-3xl border border-border bg-card p-6 text-center shadow-2xl dark:border-white/10 dark:bg-white/5">
          <p className="text-lg font-semibold">Session moved</p>
          <p className="mt-2 text-sm text-muted-foreground dark:text-gray-300">{sessionMovedMessage}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground dark:text-gray-400">
            Open the active tab to continue the consultation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Root: flex-column → video+sidebar row on top, control bar pinned at bottom */}
      <div className="flex flex-col h-full w-full min-h-0 bg-background text-foreground dark:bg-meet-black dark:text-white overflow-hidden">

        {/* Top row: video area + optional sidebar, side-by-side */}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row">

          {/* Video Area — shrinks horizontally with smooth transition when sidebar opens */}
          <div className="flex-1 relative bg-background min-w-0 overflow-hidden transition-all duration-300 ease-in-out dark:bg-meet-black">
            {!isInCall() ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-foreground dark:text-white">
                <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-lg dark:border-gray-700 dark:bg-dark-gray">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-meet-blue" />
                  {connectionIssue ? (
                    <>
                      <h2 className="mt-4 text-2xl font-semibold">{connectionIssue.title}</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground dark:text-gray-300">
                        {connectionIssue.description}
                      </p>
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                          type="button"
                          onClick={handleStartCall}
                          size="lg"
                          className="w-full sm:w-auto rounded-full bg-[#8ab4f8] px-8 text-meet-black font-semibold"
                        >
                          Retry connection
                        </Button>
                        <Button
                          type="button"
                          onClick={handleLeaveRoom}
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto rounded-full px-8 font-semibold"
                        >
                          Leave room
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="mt-4 text-2xl font-semibold">Opening room</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground dark:text-gray-300">
                        The preview is complete. Connecting you directly to the live consultation now.
                      </p>
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                          type="button"
                          disabled
                          size="lg"
                          className="w-full sm:w-auto rounded-full bg-[#8ab4f8] px-8 text-meet-black font-semibold opacity-80"
                        >
                          <Phone className="mr-2 h-5 w-5" />
                          Joining...
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              (layout === "speaker" || isScreenSharing) ? (
              <SpeakerLayout 
                  publisher={publisher} 
                  subscribers={subscribers} 
                  isHandRaised={isHandRaised}
                  raisedHands={raisedHands}
                />
              ) : (
                <GridLayout 
                  publisher={publisher} 
                  subscribers={subscribers} 
                  isHandRaised={isHandRaised}
                  raisedHands={raisedHands}
                />
              )
            )}

            {connectionIssue && isInCall() && (
              <div className="absolute left-4 right-4 top-4 z-40 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-amber-900 shadow-lg backdrop-blur dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                <div className="flex items-start gap-3">
                  <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{connectionIssue.title}</p>
                    <p className="mt-1 text-sm opacity-90">{connectionIssue.description}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleStartCall}
                    className="shrink-0 rounded-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-100 dark:hover:bg-amber-900/40"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {isConnecting && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 text-foreground dark:bg-meet-black dark:text-white">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-meet-blue" />
                  <p className="mt-4 text-lg font-medium">Joining the call...</p>
                </div>
              </div>
            )}
          </div>
          {/* Sidebar Panel — floating design with rounded borders and animation */}
          <AnimatePresence mode="wait">
            {showSidePanel && (
              <motion.div 
                key="side-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed inset-0 z-40 flex min-h-0 w-full bg-background/95 p-3 backdrop-blur-sm lg:static lg:inset-auto lg:w-[380px] lg:bg-transparent lg:p-0 lg:py-4 lg:pr-4 lg:backdrop-blur-0"
              >
                <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl relative dark:bg-meet-black dark:border-white/10 lg:flex-1 lg:rounded-2xl">
                  <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0 sm:px-6 sm:py-5 bg-gradient-to-r from-white to-slate-50 dark:border-white/10 dark:from-[#202124] dark:to-[#2b2c30]">
                    <h3 className="font-semibold text-lg text-foreground dark:text-white">
                      {activePanel === "chat"
                        ? "In-call messages"
                        : activePanel === "participants"
                        ? "Participants"
                        : "Notes"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSidePanel(false)}
                      className="rounded-full h-8 w-8 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-800 dark:bg-dark-gray dark:text-white dark:hover:bg-[#4a4d51]"
                    >
                      <span className="sr-only">Close</span>
                      <XCircle size={20} />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {activePanel === "chat" && (
                      <VideoChat
                        appointmentId={resolvedAppointmentId}
                        className="h-full min-h-0 rounded-none border-0 shadow-none bg-transparent text-foreground dark:text-white"
                      />
                    )}

                    {activePanel === "participants" && (
                      <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                        <div className="p-4 space-y-4">
                          <Button 
                            onClick={() => {
                              navigator.clipboard.writeText(meetingLink);
                              toast({
                                title: "Meeting link copied",
                                description: "Invitation link has been copied to your clipboard.",
                              });
                            }}
                            className="w-full justify-start gap-3 bg-meet-blue hover:bg-hover-primary text-white rounded-full h-11 px-6 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                          >
                            <UserPlus size={18} />
                            <span className="font-medium">Add people</span>
                          </Button>
                          
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                              placeholder="Search for people"
                              className="bg-white border-border text-foreground pl-9 h-11 rounded-xl focus:ring-blue-500 focus:border-blue-500 dark:bg-meet-black dark:border-white/10 dark:text-white"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
                          {participants.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400 mb-2" />
                              <p className="text-sm text-muted-foreground dark:text-gray-400">Loading participants...</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {filteredParticipants.map((participant) => (
                                <div 
                                  key={participant.connectionId} 
                                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer dark:hover:bg-white/5"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarTone(participant.displayName || participant.userId || participant.connectionId).backgroundClass} ${getAvatarTone(participant.displayName || participant.userId || participant.connectionId).textClass}`}>
                                        {(participant.displayName || "U").charAt(0).toUpperCase()}
                                      </div>
                                      {participant.isSpeaking && (
                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-meet-blue rounded-full border-2 border-background flex items-center justify-center dark:border-meet-black">
                                          <div className="flex gap-px items-end h-2">
                                            <div className="w-[1.5px] h-1 bg-white animate-pulse" />
                                            <div className="w-[1.5px] h-2 bg-white animate-pulse delay-75" />
                                            <div className="w-[1.5px] h-1.5 bg-white animate-pulse delay-150" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-sm font-semibold text-foreground truncate dark:text-white">
                                          {participant.displayName || "Unknown User"}
                                        </span>
                                        {participant.connectionId === (call?.getSession()?.connection?.connectionId || controls?.getSession()?.connection?.connectionId) && (
                                          <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1 border-border text-muted-foreground shrink-0 dark:border-white/20 dark:text-gray-400">
                                            You
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-muted-foreground font-medium capitalize dark:text-gray-500">
                                        {participant.role?.toLowerCase() || "Participant"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {(isDoctor || isAdmin) && (
                                      <EnhancedParticipantControls
                                        appointmentId={resolvedAppointmentId}
                                        participant={participant}
                                        currentUserId={currentUserId ?? ""}
                                        onActionComplete={updateParticipants}
                                      />
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 hover:text-slate-800 hover:bg-slate-200 dark:bg-dark-gray dark:text-white dark:hover:bg-[#4a4d51]">
                                      <MoreVertical size={16} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activePanel === "notes" && (
                      <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 custom-scrollbar">
                          <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-sm dark:border-white/10 dark:bg-meet-black">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-meet-blue">
                                  <Info size={12} />
                                  Session Info
                                </h4>
                                <p className="mt-0.5 text-[10px] sm:text-[11px] leading-4 text-muted-foreground dark:text-gray-400">
                                  Join link and schedule in one compact view.
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2.5">
                              <div className="rounded-lg bg-blue-500/5 px-2.5 py-2 border border-blue-500/10 dark:bg-white/5 dark:border-white/10">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                                  Joining info
                                </p>
                                <p className="mt-0.5 break-all text-[11px] leading-4 text-foreground dark:text-white">
                                  {meetingLink}
                                </p>
                              </div>
                              <div className="rounded-lg bg-blue-500/5 px-2.5 py-2 border border-blue-500/10 dark:bg-white/5 dark:border-white/10">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                                  Schedule
                                </p>
                                <p className="mt-0.5 text-[11px] leading-4 font-medium text-foreground dark:text-white">
                                  {appointmentStartDate ? formatDateInIST(appointmentStartDate) : "Today"}{" "}
                                  {appointmentTimeLabel ? `• ${appointmentTimeLabel}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2.5 border-t border-border/60 pt-2.5 dark:border-white/10">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                                  Clinical Notes
                                </p>
                                <span className="text-[9px] text-muted-foreground dark:text-gray-500">
                                  Scroll inside
                                </span>
                              </div>
                              <MedicalNotes
                                appointmentId={resolvedAppointmentId}
                                className="mt-2 border-0 bg-transparent shadow-none [&_header]:px-0 [&_header]:pb-2 [&_h1]:text-sm [&_h2]:text-sm"
                                compact
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-3 border-t border-border shrink-0 bg-background/80 backdrop-blur-md dark:border-white/5 dark:bg-meet-black/50">
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center flex items-center justify-center gap-2 dark:text-gray-500">
                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                            Secure end-to-end encrypted consultation
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Control Bar — always pinned at the bottom, NEVER hidden by sidebar */}
        {isInCall() && (
          <div className="shrink-0 z-50 bg-background border-t border-border dark:bg-meet-black dark:border-white/10">
            <MeetControlBar 
              appointmentId={resolvedAppointmentId}
              isAudioMuted={isAudioMuted}
              isVideoMuted={isVideoMuted}
              isScreenSharing={isScreenSharing}
              isRecording={isRecording}
              showRecordingControl={APP_CONFIG.FEATURES.VIDEO_RECORDING}
              isHandRaised={isHandRaised}
              isLocalSpeaking={isLocalSpeaking}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={toggleScreenSharing}
              onToggleRecording={toggleRecording}
              onToggleHandRaise={toggleHandRaise}
              onToggleLayout={toggleLayout}
              onToggleChat={() => toggleSidePanel("chat")}
              onToggleParticipants={() => toggleSidePanel("participants")}
              onToggleInfo={() => toggleSidePanel("notes")}
              onEndCall={handleEndCall}
              onGetDevices={call?.getDevices.bind(call) || controls?.getDevices.bind(controls)}
              onChangeAudioDevice={async (id) => {
                if (call) await call.changeAudioSource(id);
                else if (controls) await controls.changeAudioSource(id);
                setActiveAudioDeviceId(id);
              }}
              onChangeVideoDevice={async (id) => {
                if (call) await call.changeVideoSource(id);
                else if (controls) await controls.changeVideoSource(id);
                setActiveVideoDeviceId(id);
              }}
              activeAudioDeviceId={activeAudioDeviceId}
              activeVideoDeviceId={activeVideoDeviceId}
              activePanel={activePanel}
              showSidePanel={showSidePanel}
              layout={layout}
              isAudioBusy={isAudioActionBusy}
              isVideoBusy={isVideoActionBusy}
              isScreenShareBusy={isScreenShareActionBusy}
              isRecordingBusy={isRecordingActionBusy}
              isHandRaiseBusy={isHandRaiseActionBusy}
              isEndCallBusy={isEndCallActionBusy}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
