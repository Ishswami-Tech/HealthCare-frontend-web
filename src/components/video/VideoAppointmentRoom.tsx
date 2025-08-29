"use client";

// ✅ Video Appointment Room Component with WebSocket Integration
// This component provides a complete video appointment interface using Jitsi Meet with real-time WebSocket updates

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Settings,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  User,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  useVideoCall,
  useVideoCallControls,
} from "@/hooks/useVideoAppointments";
import { useVideoAppointmentWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { VideoAppointment } from "@/hooks/useVideoAppointments";

interface VideoAppointmentRoomProps {
  appointment: VideoAppointment;
  onEndCall?: () => void;
  onLeaveRoom?: () => void;
}

export function VideoAppointmentRoom({
  appointment,
  onEndCall,
  onLeaveRoom,
}: VideoAppointmentRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    startCall,
    endCall,
    getCurrentCall,
    isInCall,
    leaveCall,
    startRecording,
    stopRecording,
  } = useVideoCall();
  const { getCallControls } = useVideoCallControls();
  const {
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    sendParticipantJoined,
    sendParticipantLeft,
    sendRecordingStarted,
    sendRecordingStopped,
  } = useVideoAppointmentWebSocket();

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [call, setCall] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // ✅ Subscribe to WebSocket events
  useEffect(() => {
    // Subscribe to participant events
    const unsubscribeParticipants = subscribeToParticipantEvents((data) => {
      if (data.appointmentId === appointment.appointmentId) {
        if (data.action === "participant_joined") {
          setParticipants((prev) => [...prev, data.participant]);
          toast({
            title: "Participant Joined",
            description: `${data.participant.displayName} joined the call`,
          });
        } else if (data.action === "participant_left") {
          setParticipants((prev) =>
            prev.filter((p) => p.userId !== data.participant.userId)
          );
          toast({
            title: "Participant Left",
            description: `${data.participant.displayName} left the call`,
          });
        }
      }
    });

    // Subscribe to recording events
    const unsubscribeRecording = subscribeToRecordingEvents((data) => {
      if (data.appointmentId === appointment.appointmentId) {
        if (data.action === "recording_started") {
          setIsRecording(true);
          toast({
            title: "Recording Started",
            description: "Video recording has started",
          });
        } else if (data.action === "recording_stopped") {
          setIsRecording(false);
          toast({
            title: "Recording Stopped",
            description: "Video recording has stopped",
          });
        }
      }
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeRecording();
    };
  }, [
    appointment.appointmentId,
    subscribeToParticipantEvents,
    subscribeToRecordingEvents,
    toast,
  ]);

  // ✅ Start video call
  const handleStartCall = async () => {
    try {
      setIsConnecting(true);

      const userInfo = {
        userId: user?.id || "",
        displayName: user?.name || "Unknown User",
        email: user?.email || "",
        role: user?.role || "patient",
      };

      const videoCall = await startCall(appointment, userInfo);
      setCall(videoCall);

      // Set up video container
      if (videoContainerRef.current && videoCall) {
        // Reinitialize with the container
        await videoCall.initialize();
      }

      // Send WebSocket event for participant joined
      sendParticipantJoined(appointment.appointmentId, {
        userId: userInfo.userId,
        displayName: userInfo.displayName,
        role: userInfo.role,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Connected",
        description: "Successfully connected to video appointment",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect to video call",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // ✅ End video call
  const handleEndCall = async () => {
    try {
      if (call) {
        await endCall(appointment.appointmentId);
        setCall(null);
      }

      // Send WebSocket event for participant left
      sendParticipantLeft(appointment.appointmentId, {
        userId: user?.id || "",
        displayName: user?.name || "Unknown User",
        role: user?.role || "patient",
        timestamp: new Date().toISOString(),
      });

      if (onEndCall) {
        onEndCall();
      }

      toast({
        title: "Call Ended",
        description: "Video appointment has been ended",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end video call",
        variant: "destructive",
      });
    }
  };

  // ✅ Leave room
  const handleLeaveRoom = () => {
    if (call) {
      call.dispose();
      setCall(null);
    }

    // Send WebSocket event for participant left
    sendParticipantLeft(appointment.appointmentId, {
      userId: user?.id || "",
      displayName: user?.name || "Unknown User",
      role: user?.role || "patient",
      timestamp: new Date().toISOString(),
    });

    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

  // ✅ Get call controls
  const controls = call ? getCallControls(call) : null;

  // ✅ Toggle audio
  const toggleAudio = () => {
    if (controls) {
      controls.toggleAudio();
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // ✅ Toggle video
  const toggleVideo = () => {
    if (controls) {
      controls.toggleVideo();
      setIsVideoMuted(!isVideoMuted);
    }
  };

  // ✅ Toggle recording
  const toggleRecording = () => {
    if (controls) {
      controls.toggleRecording();
      setIsRecording(!isRecording);

      // Send WebSocket event
      if (!isRecording) {
        sendRecordingStarted(appointment.appointmentId, {
          startedBy: user?.id,
          timestamp: new Date().toISOString(),
        });
      } else {
        sendRecordingStopped(appointment.appointmentId, {
          stoppedBy: user?.id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  // ✅ Toggle screen sharing
  const toggleScreenSharing = () => {
    if (controls) {
      controls.shareScreen();
      setIsScreenSharing(!isScreenSharing);
    }
  };

  // ✅ Raise hand
  const raiseHand = () => {
    if (controls) {
      controls.raiseHand();
    }
  };

  // ✅ Update participants
  const updateParticipants = () => {
    if (controls) {
      const currentParticipants = controls.getParticipants();
      setParticipants(currentParticipants);
    }
  };

  // ✅ Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isInCall()) {
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

  // ✅ Update participants periodically
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

  // ✅ Format call duration
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

  // ✅ Get appointment status color
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-green-600" />
              <h1 className="text-xl font-semibold">Video Appointment</h1>
            </div>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.replace("-", " ").toUpperCase()}
            </Badge>
            {/* WebSocket Connection Status */}
            <div className="flex items-center space-x-1">
              {isWebSocketConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-gray-500">
                {isWebSocketConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <Clock className="h-4 w-4 inline mr-1" />
              {formatDuration(callDuration)}
            </div>
            <div className="text-sm text-gray-600">
              <Users className="h-4 w-4 inline mr-1" />
              {participants.length} participants
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="flex-1 relative bg-black">
            <div
              ref={videoContainerRef}
              className="w-full h-full"
              id="jitsi-container"
            />

            {/* Connection Status */}
            {isConnecting && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Connecting to video call...</p>
                </div>
              </div>
            )}

            {/* No Call State */}
            {!isInCall() && !isConnecting && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <Phone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-2xl font-semibold mb-2">Ready to Join</h2>
                  <p className="text-gray-400 mb-6">
                    Click the button below to start your video appointment
                  </p>
                  <Button
                    onClick={handleStartCall}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Start Video Call
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Control Bar */}
          {isInCall() && (
            <div className="bg-white border-t px-6 py-4">
              <div className="flex items-center justify-center space-x-4">
                {/* Audio Control */}
                <Button
                  variant={isAudioMuted ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleAudio}
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isAudioMuted ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>

                {/* Video Control */}
                <Button
                  variant={isVideoMuted ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full w-12 h-12 p-0"
                >
                  {isVideoMuted ? (
                    <VideoOff className="h-5 w-5" />
                  ) : (
                    <Video className="h-5 w-5" />
                  )}
                </Button>

                {/* Screen Share */}
                <Button
                  variant={isScreenSharing ? "default" : "outline"}
                  size="lg"
                  onClick={toggleScreenSharing}
                  className="rounded-full w-12 h-12 p-0"
                >
                  <Monitor className="h-5 w-5" />
                </Button>

                {/* Recording */}
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleRecording}
                  className="rounded-full w-12 h-12 p-0"
                >
                  <CircleDot className="h-5 w-5" />
                </Button>

                {/* Raise Hand */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={raiseHand}
                  className="rounded-full w-12 h-12 p-0"
                >
                  <Hand className="h-5 w-5" />
                </Button>

                {/* End Call */}
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleEndCall}
                  className="rounded-full w-12 h-12 p-0"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l">
          {/* Appointment Info */}
          <Card className="border-0 rounded-none border-b">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {new Date(appointment.startTime).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {new Date(appointment.startTime).toLocaleTimeString()} -{" "}
                  {new Date(appointment.endTime).toLocaleTimeString()}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Doctor ID:</span>
                  <span className="text-sm text-gray-600">
                    {appointment.doctorId}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Patient ID:</span>
                  <span className="text-sm text-gray-600">
                    {appointment.patientId}
                  </span>
                </div>
              </div>
              {appointment.notes && (
                <div className="pt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Notes:</span>
                  </div>
                  <p className="text-sm text-gray-600">{appointment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="border-0 rounded-none border-b">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 rounded bg-gray-50"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        {participant.displayName || "Unknown"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {participant.role}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No participants yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 rounded-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Chat
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={handleLeaveRoom}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Leave Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
