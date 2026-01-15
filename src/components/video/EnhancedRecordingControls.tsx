"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pause,
  Play,
  Settings,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import {
  pauseRecording,
  resumeRecording,
  setRecordingQuality,
} from "@/lib/actions/video-enhanced.server";
import { useToast } from "@/hooks/utils/use-toast";

interface EnhancedRecordingControlsProps {
  appointmentId: string;
  isRecording: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

export function EnhancedRecordingControls({
  appointmentId,
  isRecording,
}: EnhancedRecordingControlsProps) {
  const { toast } = useToast();
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState<"low" | "medium" | "high" | "ultra">("high");

  const { subscribeToRecordingEvents, isConnected } = useVideoAppointmentWebSocket();

  // Subscribe to recording pause/resume events
  React.useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToRecordingEvents((data) => {
      if (data.appointmentId === appointmentId) {
        if (data.action === "recording_paused") {
          setIsPaused(true);
        } else if (data.action === "recording_resumed") {
          setIsPaused(false);
        }
      }
    });

    return unsubscribe;
  }, [isConnected, appointmentId, subscribeToRecordingEvents]);

  const handlePause = async () => {
    setIsLoading(true);
    try {
      const result = await pauseRecording(appointmentId);
      if (result.success) {
        setIsPaused(true);
        toast({
          title: "Recording Paused",
          description: "Recording has been paused",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause recording",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      const result = await resumeRecording(appointmentId);
      if (result.success) {
        setIsPaused(false);
        toast({
          title: "Recording Resumed",
          description: "Recording has been resumed",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resume recording",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQualityChange = async (newQuality: "low" | "medium" | "high" | "ultra") => {
    setIsLoading(true);
    try {
      const result = await setRecordingQuality(appointmentId, newQuality);
      if (result.success) {
        setQuality(newQuality);
        toast({
          title: "Quality Updated",
          description: `Recording quality set to ${newQuality}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update recording quality",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-2">
      {isPaused ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleResume}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </>
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={handlePause}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          )}
        </Button>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" disabled={isLoading}>
            <Settings className="h-4 w-4 mr-2" />
            Quality: {quality}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-2">
            <p className="text-sm font-medium mb-2">Recording Quality</p>
            <Select value={quality} onValueChange={(v) => handleQualityChange(v as typeof quality)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (480p)</SelectItem>
                <SelectItem value="medium">Medium (720p)</SelectItem>
                <SelectItem value="high">High (1080p)</SelectItem>
                <SelectItem value="ultra">Ultra (4K)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>

      {isPaused && (
        <Badge variant="secondary" className="gap-1">
          <Pause className="h-3 w-3" />
          Paused
        </Badge>
      )}
    </div>
  );
}


