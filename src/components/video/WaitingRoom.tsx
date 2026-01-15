"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Clock,
  UserCheck,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { Permission } from "@/types/rbac.types";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import {
  joinWaitingRoom,
  leaveWaitingRoom,
  getWaitingRoomQueue,
  admitFromWaitingRoom,
  type WaitingRoomParticipant,
} from "@/lib/actions/video-enhanced.server";
import { useToast } from "@/hooks/utils/use-toast";
import { formatDistanceToNow } from "date-fns";

interface WaitingRoomProps {
  appointmentId: string;
  onAdmitted?: (token: string) => void;
  className?: string;
}

export function WaitingRoom({
  appointmentId,
  onAdmitted,
  className,
}: WaitingRoomProps) {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(
    null
  );
  const [queue, setQueue] = useState<WaitingRoomParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joinedAt, setJoinedAt] = useState<Date | null>(null);

  const isDoctor = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
  const { subscribeToWaitingRoom, isConnected } = useVideoAppointmentWebSocket();

  // Load queue if doctor
  useEffect(() => {
    if (isDoctor) {
      const loadQueue = async () => {
        try {
      const result = await getWaitingRoomQueue(appointmentId);
      if (result && result.queue) {
        setQueue(result.queue);
      }
        } catch (error) {
          // Error handled by React Query
        }
      };

      loadQueue();
      // Only load once, WebSocket handles real-time updates
      loadQueue();
    }
  }, [appointmentId, isDoctor]);

  // Subscribe to waiting room events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToWaitingRoom((data: unknown) => {
      const eventData = data as {
        appointmentId: string;
        action: string;
        participant?: WaitingRoomParticipant;
        token?: string;
      };
      if (eventData.appointmentId === appointmentId) {
        if (eventData.action === "waiting_room_joined") {
          setQueue((prev) => {
            const participant = eventData.participant;
            if (!participant || prev.some((p) => p.userId === participant.userId)) return prev;
            return [...prev, participant];
          });
        } else if (eventData.action === "waiting_room_left") {
          setQueue((prev) =>
            prev.filter((p) => p.userId !== (eventData.participant?.userId || ""))
          );
        } else if (eventData.action === "waiting_room_admitted") {
          if (eventData.participant?.userId === user?.id) {
            setIsInWaitingRoom(false);
            if (eventData.token && onAdmitted) {
              onAdmitted(eventData.token);
            }
          }
          setQueue((prev) =>
            prev.filter((p) => p.userId !== (eventData.participant?.userId || ""))
          );
        }
      }
    });

    return unsubscribe;
  }, [isConnected, appointmentId, subscribeToWaitingRoom, user?.id, onAdmitted]);

  // Update position and wait time
  // Update position via WebSocket, not polling
  // Position updates come from backend via WebSocket events
  // No need for setInterval here

  const handleJoinWaitingRoom = async () => {
    setIsLoading(true);
    try {
      const result = await joinWaitingRoom(appointmentId);
      if (result) {
        setIsInWaitingRoom(true);
        setPosition(result.position || 0);
        setEstimatedWaitTime(result.estimatedWaitTime || null);
        setJoinedAt(new Date());
        toast({
          title: "Joined Waiting Room",
          description: `You are in queue. Position: ${result.position || 0}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join waiting room",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveWaitingRoom = async () => {
    setIsLoading(true);
    try {
      const result = await leaveWaitingRoom(appointmentId);
      if (result && result.success) {
        setIsInWaitingRoom(false);
        setPosition(null);
        setEstimatedWaitTime(null);
        setJoinedAt(null);
        toast({
          title: "Left Waiting Room",
          description: "You have left the waiting room",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave waiting room",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdmit = async (userId: string) => {
    try {
      const result = await admitFromWaitingRoom(appointmentId, userId);
      if (result) {
        toast({
          title: "Participant Admitted",
          description: "Participant has been admitted to the consultation",
        });
        // Note: admitFromWaitingRoom doesn't return token in current implementation
        // Token would come from WebSocket event instead
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to admit participant",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Doctor view - show queue
  if (isDoctor) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Waiting Room</span>
            <Badge variant="outline">{queue.length} waiting</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No one in waiting room</p>
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(participant.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {participant.userRole} • Waiting{" "}
                        {formatDistanceToNow(new Date(participant.joinedAt))}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdmit(participant.userId)}
                    disabled={isLoading}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Admit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Patient view - show waiting status
  if (isInWaitingRoom) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Waiting Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="font-semibold mb-2">Waiting for doctor...</h3>
            {position !== null && (
              <p className="text-muted-foreground">
                Your position in queue: <strong>{position + 1}</strong>
              </p>
            )}
            {estimatedWaitTime && (
              <p className="text-sm text-muted-foreground mt-2">
                Estimated wait time: ~{Math.ceil(estimatedWaitTime / 60)} minutes
              </p>
            )}
            {joinedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Waiting for {formatDistanceToNow(joinedAt)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Please wait. The doctor will admit you shortly.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleLeaveWaitingRoom}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Leave Waiting Room
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Not in waiting room - show join button
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Waiting Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-6">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Join Waiting Room</h3>
          <p className="text-sm text-muted-foreground">
            Join the waiting room to be admitted by the doctor when ready
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleJoinWaitingRoom}
          disabled={isLoading || !isConnected}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Join Waiting Room
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

