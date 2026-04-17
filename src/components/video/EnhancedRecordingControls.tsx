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
  usePauseVideoRecording,
  useResumeVideoRecording,
  useSetVideoRecordingQuality,
} from "@/hooks/query";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";

interface EnhancedRecordingControlsProps {
  appointmentId: string;
  isRecording: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
}

export function EnhancedRecordingControls({
  appointmentId,
  isRecording,
}: EnhancedRecordingControlsProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [quality, setQuality] = useState<"low" | "medium" | "high" | "ultra">("high");

  const { subscribeToRecordingEvents, isConnected } = useVideoAppointmentWebSocket();
  const pauseRecordingMutation = usePauseVideoRecording();
  const resumeRecordingMutation = useResumeVideoRecording();
  const setRecordingQualityMutation = useSetVideoRecordingQuality();
  const isLoading =
    pauseRecordingMutation.isPending ||
    resumeRecordingMutation.isPending ||
    setRecordingQualityMutation.isPending;

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
    try {
      const result = await pauseRecordingMutation.mutateAsync(appointmentId);
      if (result.success) {
        setIsPaused(true);
        showSuccessToast("Recording paused", {
          id: TOAST_IDS.VIDEO.END,
          description: "Recording has been paused",
        });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const handleResume = async () => {
    try {
      const result = await resumeRecordingMutation.mutateAsync(appointmentId);
      if (result.success) {
        setIsPaused(false);
        showSuccessToast("Recording resumed", {
          id: TOAST_IDS.VIDEO.JOIN,
          description: "Recording has been resumed",
        });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  const handleQualityChange = async (newQuality: "low" | "medium" | "high" | "ultra") => {
    try {
      const result = await setRecordingQualityMutation.mutateAsync({
        appointmentId,
        quality: newQuality,
      });
      if (result.success) {
        setQuality(newQuality);
        showSuccessToast("Recording quality updated", {
          id: TOAST_IDS.VIDEO.JOIN,
          description: `Recording quality set to ${newQuality}`,
        });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
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
            <Select value={quality} onValueChange={(v) => void handleQualityChange(v as typeof quality)}>
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


