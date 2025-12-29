"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  MicOff,
  Download,
  Search,
  User,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVideoAppointmentWebSocket } from "@/hooks/useVideoAppointmentSocketIO";
import {
  getTranscription,
  type TranscriptionSegment,
} from "@/lib/actions/video-enhanced.server";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface CallTranscriptionProps {
  appointmentId: string;
  className?: string;
}

export function CallTranscription({
  appointmentId,
  className,
}: CallTranscriptionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([]);
  const [fullText, setFullText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { subscribeToTranscription, isConnected } = useVideoAppointmentWebSocket();

  // Load existing transcription
  useEffect(() => {
    const loadTranscription = async () => {
      try {
        const result = await getTranscription(appointmentId);
        if (result) {
          if ('segments' in result) {
            setTranscription(result.segments);
            if ('fullText' in result) {
              setFullText(result.fullText);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load transcription:", error);
      }
    };

    loadTranscription();
  }, [appointmentId]);

  // Subscribe to real-time transcription
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToTranscription((data) => {
      if (data.appointmentId === appointmentId) {
        if (data.action === "transcription_started") {
          setIsTranscribing(true);
          toast({
            title: "Transcription Started",
            description: "Call is now being transcribed",
          });
        } else if (data.action === "transcription_stopped") {
          setIsTranscribing(false);
          toast({
            title: "Transcription Stopped",
            description: "Transcription has been stopped",
          });
        } else if (data.action === "transcription_segment") {
          const segment = data.segment as unknown as TranscriptionSegment;
          setTranscription((prev) => {
            // Avoid duplicates
            if (prev.some((s) => s.id === segment.id)) return prev;
            return [...prev, segment].sort((a, b) => a.startTime - b.startTime);
          });
          setFullText((prev) => `${prev} ${segment.text}`.trim());

          // Auto-scroll to bottom
          setTimeout(() => {
            scrollAreaRef.current?.scrollTo({
              top: scrollAreaRef.current.scrollHeight,
              behavior: "smooth",
            });
          }, 100);
        }
      }
    });

    return unsubscribe;
  }, [isConnected, appointmentId, subscribeToTranscription, toast]);

  // Transcription is created automatically by backend when segments are received

  const handleDownload = () => {
    const content = transcription
      .map(
        (seg) =>
          `[${formatTime(seg.startTime)}] ${seg.speaker} (${seg.speakerRole}): ${seg.text}`
      )
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription-${appointmentId}-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredTranscription = searchTerm
    ? transcription.filter((seg) =>
        seg.text.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transcription;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Call Transcription</CardTitle>
          <div className="flex gap-2">
            {transcription.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[400px]">
        {/* Search */}
        {transcription.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcription..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Transcription Content */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          {transcription.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transcription yet</p>
                <p className="text-xs mt-2">
                  Transcription will appear here as the call progresses
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {filteredTranscription.map((segment) => (
                <div key={segment.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {segment.speaker} ({segment.speakerRole})
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        opacity: segment.confidence,
                      }}
                    >
                      {Math.round(segment.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

      </CardContent>
    </Card>
  );
}

