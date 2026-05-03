
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
  ChevronUp
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
  getVideoSessionDecision
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

interface GoogleMeetVideoRoomProps {
  appointment: VideoAppointment;
  onLeaveRoom?: () => void;
  autoStart?: boolean;
  startWithAudioEnabled?: boolean;
  startWithVideoEnabled?: boolean;
  startWithAudioSource?: string | undefined;
  startWithVideoSource?: string | undefined;
}

export default function GoogleMeetVideoRoom({
  appointment,
  onLeaveRoom,
  startWithAudioEnabled = true,
  startWithVideoEnabled = true,
  startWithAudioSource,
  startWithVideoSource,
}: GoogleMeetVideoRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const resolvedAppointmentId = appointment.appointmentId;
  const currentUserId = user?.id;
  const isDoctor = user?.role === "DOCTOR" || user?.role === "ASSISTANT_DOCTOR";
  const isAdmin = user?.role === "CLINIC_ADMIN" || user?.role === "SUPER_ADMIN";
  const canEndForAll = isDoctor || isAdmin;

  // Use the refined video hooks
  const { 
    startCall, 
    endCall, 
    isInCall, 
    publisher, 
    subscribers,
    getCurrentCall
  } = useVideoCall();
  const { getCallControls } = useVideoCallControls();
  
  const { 
    sendVideoAppointmentEvent,
    sendParticipantJoined,
    sendParticipantLeft,
    sendRecordingStarted,
    sendRecordingStopped
  } = useVideoAppointmentWebSocket();

  // Component local state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [call, setCall] = useState<OpenViduAPI | null>(null);
  const callRef = useRef<OpenViduAPI | null>(null);

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

  // Toggle hand raise signal
  const toggleHandRaise = () => {
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
  };
  const [layout, setLayout] = useState<"grid" | "speaker">("grid");
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "notes" | "participants">("chat");
  const [activeAudioDeviceId, setActiveAudioDeviceId] = useState<string | null>(null);
  const [activeVideoDeviceId, setActiveVideoDeviceId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  
  const filteredParticipants = participants.filter((p: ParticipantInfo) => 
    p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [isBlurred, setIsBlurred] = useState(false);

  const videoSessionDecision = getVideoSessionDecision(appointment);

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

  const handleStartCall = async () => {
    try {
      setIsConnecting(true);
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
          ...(startWithAudioSource !== undefined && { audioSource: startWithAudioSource }),
          ...(startWithVideoSource !== undefined && { videoSource: startWithVideoSource }),
        }
      );
      setCall(videoCall);
      callRef.current = videoCall;
      
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

  const handleEndCall = async (options?: { skipToast?: boolean }) => {
    try {
      if (call) {
        await endCall(resolvedAppointmentId);
        call.dispose();
        setCall(null);
        callRef.current = null;
      }

      if (!options?.skipToast) {
        showSuccessToast("Call ended", { id: TOAST_IDS.VIDEO.END });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const handleLeaveRoom = () => {
    if (call) {
      call.dispose();
      setCall(null);
      callRef.current = null;
    }

    sendParticipantLeft(resolvedAppointmentId, {
      userId: currentUserId ?? "",
      displayName: resolveVideoDisplayName(user),
      role: user?.role || "patient",
    });

    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

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
    controls?.toggleAudio();
  };

  const toggleVideo = () => {
    controls?.toggleVideo();
  };

  const toggleRecording = () => {
    if (!controls) return;
    controls.toggleRecording();
    const next = !isRecording;
    setIsRecording(next);
    if (next) {
      sendRecordingStarted(resolvedAppointmentId, { recordingId: resolvedAppointmentId, status: 'starting' });
    } else {
      sendRecordingStopped(resolvedAppointmentId, { recordingId: resolvedAppointmentId, status: 'stopped' });
    }
  };

  const toggleScreenSharing = async () => {
    if (!controls) return;
    if (isScreenSharing) {
      try {
        await controls.stopScreenShare();
      } catch (error) {
        console.error('Error stopping screen share:', error);
      }
    } else {
      try {
        await controls.shareScreen();
      } catch (error) {
        console.error('Error starting screen share:', error);
        setIsScreenSharing(false);
      }
    }
  };

  const toggleLayout = () => {
    setLayout((prev) => (prev === "grid" ? "speaker" : "grid"));
  };

  const updateParticipants = () => {
    const current = call ? call.getParticipants() : (controls ? controls.getParticipants() : []);
    setParticipants(current);
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

  return (
    <TooltipProvider>
      {/* Root: flex-column → video+sidebar row on top, control bar pinned at bottom */}
      <div className="flex flex-col h-full w-full min-h-0 bg-[#202124] overflow-hidden">

        {/* Top row: video area + optional sidebar, side-by-side */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Video Area — shrinks horizontally with smooth transition when sidebar opens */}
          <div className="flex-1 relative bg-[#202124] min-w-0 overflow-hidden transition-all duration-300 ease-in-out">
            {!isInCall() ? (
              !isConnecting && (
                <div className="flex h-full flex-col items-center justify-center p-6 text-white">
                  <div className="w-full max-w-xl rounded-2xl border border-gray-700 bg-[#3c4043] p-8 text-center shadow-lg">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#202124] mb-4">
                      <Phone className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold">Ready to Join</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-300">
                      Check your camera and microphone before joining.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        onClick={handleStartCall}
                        size="lg"
                        className="w-full sm:w-auto rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] px-8 text-[#202124] font-semibold"
                      >
                        <Phone className="mr-2 h-5 w-5" />
                        {videoSessionDecision.label}
                      </Button>
                    </div>
                  </div>
                </div>
              )
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

            {isConnecting && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#202124] bg-opacity-90 text-white">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#8ab4f8]" />
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
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 380 }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col min-h-0 py-4 pr-4 z-40 overflow-hidden"
              >
                <div className="flex-1 flex flex-col bg-[#202124] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
                    <h3 className="font-semibold text-lg text-white">
                      {activePanel === "chat"
                        ? "In-call messages"
                        : activePanel === "participants"
                        ? "People"
                        : "Meeting Details"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSidePanel(false)}
                      className="rounded-full h-8 w-8 hover:bg-white/10 text-gray-400 hover:text-white"
                    >
                      <span className="sr-only">Close</span>
                      <XCircle size={20} />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {activePanel === "chat" && (
                      <VideoChat
                        appointmentId={resolvedAppointmentId}
                        className="h-full rounded-none border-0 shadow-none bg-transparent text-white"
                      />
                    )}

                    {activePanel === "participants" && (
                      <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                        <div className="p-4 space-y-4">
                          <Button 
                            onClick={() => {
                              const link = `https://healthcare.app/meet/${resolvedAppointmentId}`;
                              navigator.clipboard.writeText(link);
                              toast({
                                title: "Meeting link copied",
                                description: "Invitation link has been copied to your clipboard.",
                              });
                            }}
                            className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-11 px-6 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                          >
                            <UserPlus size={18} />
                            <span className="font-medium">Add people</span>
                          </Button>
                          
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                              placeholder="Search for people"
                              className="bg-[#202124] border-white/10 text-white pl-9 h-11 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
                          {participants.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400 mb-2" />
                              <p className="text-sm text-gray-400">Loading participants...</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {filteredParticipants.map((participant) => (
                                <div 
                                  key={participant.connectionId} 
                                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                                        {(participant.displayName || "U").charAt(0).toUpperCase()}
                                      </div>
                                      {participant.isSpeaking && (
                                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 rounded-full border-2 border-[#202124] flex items-center justify-center">
                                          <div className="flex gap-[1px] items-end h-2">
                                            <div className="w-[1.5px] h-1 bg-white animate-pulse" />
                                            <div className="w-[1.5px] h-2 bg-white animate-pulse delay-75" />
                                            <div className="w-[1.5px] h-1.5 bg-white animate-pulse delay-150" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-sm font-semibold text-white truncate">
                                          {participant.displayName || "Unknown User"}
                                        </span>
                                        {participant.connectionId === (call?.getSession()?.connection?.connectionId || controls?.getSession()?.connection?.connectionId) && (
                                          <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1 border-white/20 text-gray-400 shrink-0">
                                            You
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-gray-500 font-medium capitalize">
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-white/10">
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
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                          <div>
                            <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                              <Info size={16} />
                              Joining info
                            </h4>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 group hover:bg-white/10 transition-colors">
                              <p className="text-sm text-gray-300 break-all select-all cursor-copy">
                                https://healthcare.app/meet/{resolvedAppointmentId}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">Meeting Details</p>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Date</p>
                                  <p className="text-sm font-medium">{appointmentStartDate ? formatDateInIST(appointmentStartDate) : 'Today'}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Time</p>
                                  <p className="text-sm font-medium">{appointmentTimeLabel || 'Now'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="pt-2">
                              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">Clinical Notes</p>
                              <MedicalNotes 
                                appointmentId={resolvedAppointmentId}
                                className="bg-white/5 border-white/10 shadow-none border rounded-2xl overflow-hidden" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-6 border-t border-white/5 shrink-0 bg-[#202124]/50 backdrop-blur-md">
                          <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-2">
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
          <div className="shrink-0 z-50 bg-[#202124] border-t border-white/10">
            <MeetControlBar 
              appointmentId={resolvedAppointmentId}
              isAudioMuted={isAudioMuted}
              isVideoMuted={isVideoMuted}
              isScreenSharing={isScreenSharing}
              isRecording={isRecording}
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
              isBlurred={isBlurred}
              onToggleBlur={() => setIsBlurred(!isBlurred)}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
