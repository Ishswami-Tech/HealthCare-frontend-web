"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Mic,
  MicOff,
  Video,
  VideoOff,
  UserX,
  Shield,
  ShieldOff,
  Monitor,
  MonitorOff,
  Loader2,
} from "lucide-react";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { Permission } from "@/types/rbac.types";
import { manageParticipantEnhanced } from "@/lib/actions/video-enhanced.server";
import { useToast } from "@/hooks/utils/use-toast";
import type { ParticipantInfo } from "@/lib/video/openvidu";

interface EnhancedParticipantControlsProps {
  appointmentId: string;
  participant: ParticipantInfo;
  currentUserId: string;
  onActionComplete?: () => void;
}

export function EnhancedParticipantControls({
  appointmentId,
  participant,
  currentUserId,
  onActionComplete,
}: EnhancedParticipantControlsProps) {
  const { hasPermission } = useRBAC();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const canManage = hasPermission(Permission.END_VIDEO_APPOINTMENTS);
  const isSelf = participant.userId === currentUserId;

  if (!canManage || isSelf) {
    return null;
  }

  const handleAction = async (
    action: "mute" | "unmute" | "remove" | "promote" | "demote" | "disable_video" | "enable_video" | "grant_screen_share" | "revoke_screen_share"
  ) => {
    setIsLoading(true);
    try {
      const participantId = participant.userId || participant.connectionId;
      if (!participantId) {
        toast({
          title: "Error",
          description: "Participant ID is missing",
          variant: "destructive",
        });
        return;
      }
      const result = await manageParticipantEnhanced(appointmentId, {
        participantId,
        action,
      });

      if (result.success) {
        toast({
          title: "Action Completed",
          description: `Participant ${action} action completed`,
        });
        if (onActionComplete) {
          onActionComplete();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} participant`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Participant Controls</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleAction("mute")}>
          <MicOff className="h-4 w-4 mr-2" />
          Mute Audio
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("unmute")}>
          <Mic className="h-4 w-4 mr-2" />
          Unmute Audio
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleAction("disable_video")}>
          <VideoOff className="h-4 w-4 mr-2" />
          Disable Video
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("enable_video")}>
          <Video className="h-4 w-4 mr-2" />
          Enable Video
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleAction("grant_screen_share")}>
          <Monitor className="h-4 w-4 mr-2" />
          Allow Screen Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("revoke_screen_share")}>
          <MonitorOff className="h-4 w-4 mr-2" />
          Revoke Screen Share
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleAction("promote")}>
          <Shield className="h-4 w-4 mr-2" />
          Promote to Moderator
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("demote")}>
          <ShieldOff className="h-4 w-4 mr-2" />
          Remove Moderator
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleAction("remove")}
          className="text-destructive"
        >
          <UserX className="h-4 w-4 mr-2" />
          Remove Participant
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


