"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
} from "lucide-react";
import { useVideoAppointmentWebSocket } from "@/hooks/useVideoAppointmentSocketIO";
import {
  getCallQuality,
  updateQualityMetrics,
  type CallQualityMetrics,
} from "@/lib/actions/video-enhanced.server";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [quality, setQuality] = useState<CallQualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { subscribeToCallQuality, isConnected } =
    useVideoAppointmentWebSocket();

  // Load initial quality metrics (only once, WebSocket handles updates)
  useEffect(() => {
    let mounted = true;
    const loadQuality = async () => {
      try {
        const result = await getCallQuality(appointmentId);
        if (mounted && result) {
          setQuality(result);
        }
      } catch (error) {
        console.error("Failed to load call quality:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadQuality();
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  // Subscribe to real-time quality updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToCallQuality((data) => {
      if (data.appointmentId === appointmentId && data.metrics) {
        const metrics = data.metrics as unknown as CallQualityMetrics;
        if (metrics) {
          setQuality(metrics);
        }
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

  const handleReportIssue = async () => {
    try {
      await updateQualityMetrics(
        appointmentId,
        quality || {
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
        }
      );
      toast({
        title: "Issue Reported",
        description: "Your quality issue has been reported",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report issue",
        variant: "destructive",
      });
    }
  };

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
          className="text-xs text-primary hover:underline mt-2"
        >
          Report Issue
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
