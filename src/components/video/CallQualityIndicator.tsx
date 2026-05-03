"use client";
import { nowIso } from '@/lib/utils/date-time';

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
} from "lucide-react";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useCallQuality,
  useUpdateCallQualityMetrics,
  type CallQualityMetrics,
} from "@/hooks/query";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CallQualityIndicatorProps {
  appointmentId: string;
  className?: string;
  showDetails?: boolean;
}

export function CallQualityIndicator({
  appointmentId,
  className,
  showDetails = false,
}: CallQualityIndicatorProps) {
  const [quality, setQuality] = useState<CallQualityMetrics | null>(null);
  const { user } = useAuth();
  const isUserReady = Boolean(user?.id);
  const { data: callQuality, isPending: isLoading } = useCallQuality(appointmentId, user?.id);
  const updateCallQualityMutation = useUpdateCallQualityMetrics();
  const isReportingIssue = updateCallQualityMutation.isPending;
  const { subscribeToCallQuality, isConnected } =
    useVideoAppointmentWebSocket();

  useEffect(() => {
    setQuality(callQuality ?? null);
  }, [callQuality]);

  // Subscribe to real-time quality updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToCallQuality((data) => {
      const metrics = (data as { metrics?: CallQualityMetrics }).metrics ??
        (data as unknown as CallQualityMetrics);
      if (metrics) {
        setQuality(metrics);
      }
    });

    return unsubscribe;
  }, [isConnected, appointmentId, subscribeToCallQuality]);

  // Get quality status
  const getQualityStatus = () => {
    if (!quality) return { status: "unknown", color: "gray", icon: WifiOff };

    const networkQuality = quality.network.connectionQuality;
    const videoQuality = quality.video.quality;
    const audioQuality = quality.audio.quality;

    // Determine overall quality (worst of the three)
    const overallQuality =
      networkQuality === "poor" ||
      videoQuality === "poor" ||
      audioQuality === "poor"
        ? "poor"
        : networkQuality === "fair" ||
          videoQuality === "fair" ||
          audioQuality === "fair"
        ? "fair"
        : networkQuality === "good" ||
          videoQuality === "good" ||
          audioQuality === "good"
        ? "good"
        : "excellent";

    const statusConfig = {
      excellent: {
        status: "Excellent",
        color: "green",
        icon: SignalHigh,
        variant: "default" as const,
      },
      good: {
        status: "Good",
        color: "blue",
        icon: Signal,
        variant: "default" as const,
      },
      fair: {
        status: "Fair",
        color: "yellow",
        icon: SignalMedium,
        variant: "secondary" as const,
      },
      poor: {
        status: "Poor",
        color: "red",
        icon: SignalLow,
        variant: "destructive" as const,
      },
      unknown: {
        status: "Unknown",
        color: "gray",
        icon: WifiOff,
        variant: "outline" as const,
      },
    };

    return statusConfig[overallQuality] || statusConfig.unknown;
  };

  const qualityStatus = getQualityStatus();
  const QualityIcon = qualityStatus.icon;
  const qualityVariant =
    "variant" in qualityStatus ? qualityStatus.variant : "outline";
  const fallbackMetrics: CallQualityMetrics = {
    consultationId: appointmentId,
    userId: "",
    timestamp: nowIso(),
    network: {
      latency: 0,
      jitter: 0,
      packetLoss: 0,
      bandwidth: 0,
      connectionQuality: "poor",
    },
    audio: { bitrate: 0, codec: "", quality: "poor" },
    video: {
      bitrate: 0,
      resolution: "",
      framerate: 0,
      codec: "",
      quality: "poor",
    },
  };

  const handleReportIssue = async () => {
    try {
      await updateCallQualityMutation.mutateAsync({
        appointmentId,
        metrics: quality || fallbackMetrics,
      });
      showSuccessToast("Issue reported", {
        id: TOAST_IDS.VIDEO.ERROR,
        description: "Your quality issue has been reported",
      });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.VIDEO.ERROR });
    }
  };

  if (!isUserReady) {
    return (
      <Badge variant="outline" className={className}>
        <Wifi className="h-3 w-3 mr-1 animate-pulse" />
        Preparing...
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Wifi className="h-3 w-3 mr-1 animate-pulse" />
        Checking...
      </Badge>
    );
  }

  if (!quality) {
    return (
      <Badge variant="outline" className={className}>
        <WifiOff className="h-3 w-3 mr-1" />
        No data
      </Badge>
    );
  }

  const qualityDetails = showDetails ? (
    <div className="space-y-2 text-xs">
      <div className="flex justify-between">
        <span>Network:</span>
        <span className="font-medium">{quality.network.connectionQuality}</span>
      </div>
      <div className="flex justify-between">
        <span>Latency:</span>
        <span className="font-medium">{quality.network.latency}ms</span>
      </div>
      <div className="flex justify-between">
        <span>Packet Loss:</span>
        <span className="font-medium">{quality.network.packetLoss}%</span>
      </div>
      <div className="flex justify-between">
        <span>Video:</span>
        <span className="font-medium">{quality.video.quality}</span>
      </div>
      <div className="flex justify-between">
        <span>Audio:</span>
        <span className="font-medium">{quality.audio.quality}</span>
      </div>
      {quality.network.connectionQuality === "poor" && (
        <button
          onClick={handleReportIssue}
          disabled={isReportingIssue}
          className="text-xs text-primary hover:underline mt-2"
        >
          {isReportingIssue ? "Reporting..." : "Report Issue"}
        </button>
      )}
    </div>
  ) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={qualityVariant} className={className}>
            <QualityIcon className="h-3 w-3 mr-1" />
            {qualityStatus.status}
          </Badge>
        </TooltipTrigger>
        {qualityDetails && (
          <TooltipContent side="bottom" className="w-48">
            {qualityDetails}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
