"use client";

import React from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Mic,
  PlayCircle,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useAppointmentServices } from "@/hooks/query/useAppointments";
import { cn } from "@/lib/utils";
import {
  getAppointmentDoctorName,
  getAppointmentPatientName,
  getAppointmentServiceLabel,
  getAppointmentViewState,
  getDisplayAppointmentDuration,
  getVideoAppointmentFee,
} from "@/lib/utils/appointmentUtils";
import {
  getMedicalNotes,
  getParticipants,
  getTranscription,
} from "@/lib/actions/video.server";
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments";

// Dynamic import with ssr:false is REQUIRED for Daily.js.
// The Daily SDK is browser-only: its IIFE sets `callMachine` on `window`/`self`,
// which are undefined during SSR and cause:
//   TypeError: Cannot set properties of undefined (setting 'callMachine')
const DailyCallSurface = dynamic(
  () => import("@/components/video/DailyInAppCall").then((mod) => mod.DailyCallSurface),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full min-h-[100dvh] items-center justify-center bg-[#111315] px-6 text-center text-white">
        <div className="space-y-4 max-w-xs w-full">
          <div className="relative mx-auto h-14 w-14">
            <div className="h-full w-full animate-spin rounded-full border-2 border-[#8ab4f8]/20 border-t-[#8ab4f8]" />
          </div>
          <div>
            <p className="text-[16px] font-medium text-white">Loading video engine…</p>
            <p className="mt-1 text-[13px] text-[#9aa0a6]">Setting up your secure session.</p>
          </div>
        </div>
      </div>
    ),
  }
);

export type VideoRoomAccess = {
  provider: "cloudflare" | "daily" | "google-meet";
  token: string;
  roomName: string;
  meetingUrl: string;
  roomId: string;
  meetingId: string;
};

type RoomProps = {
  appointment: VideoAppointment;
  viewerRole?: string | undefined;
  access: VideoRoomAccess;
  onLeave?: (() => void) | undefined;
};

export type RoomData = {
  chatMessages: Array<Record<string, unknown>>;
  waitingQueue: Array<Record<string, unknown>>;
  waitingTotal: number;
  notes: Array<Record<string, unknown>>;
  transcriptSegments: Array<Record<string, unknown>>;
  transcriptFullText: string;
  participants: Array<Record<string, unknown>>;
};

const EMPTY_ROOM_DATA: RoomData = {
  chatMessages: [],
  waitingQueue: [],
  waitingTotal: 0,
  notes: [],
  transcriptSegments: [],
  transcriptFullText: "",
  participants: [],
};

type MeetPanel = "chat" | "people";


function formatProviderLabel(provider: VideoRoomAccess["provider"]) {
  switch (provider) {
    case "cloudflare":
      return "Cloudflare Realtime";
    case "daily":
      return "Daily";
    case "google-meet":
      return "Google Meet";
    default:
      return "Backend Video API";
  }
}

function safeText(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text ? text : fallback;
}

async function loadRoomData(appointmentId: string): Promise<RoomData> {
  const [notes, transcript, participants] = await Promise.all([
    getMedicalNotes(appointmentId).catch(() => ({ notes: [] as Array<Record<string, unknown>> })),
    getTranscription(appointmentId).catch(() => ({ segments: [] as Array<Record<string, unknown>>, fullText: "" })),
    getParticipants(appointmentId).catch(() => [] as Array<Record<string, unknown>>),
  ]);

  return {
    chatMessages: [],
    waitingQueue: [],
    waitingTotal: 0,
    notes: Array.isArray((notes as { notes?: unknown }).notes)
      ? ((notes as { notes: Array<Record<string, unknown>> }).notes || [])
      : [],
    transcriptSegments: Array.isArray((transcript as { segments?: unknown }).segments)
      ? ((transcript as { segments: Array<Record<string, unknown>> }).segments || [])
      : [],
    transcriptFullText: String((transcript as { fullText?: unknown }).fullText || ""),
    participants: Array.isArray(participants) ? participants : [],
  };
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-lg bg-[#f8f9fa] border border-[#dadce0] p-6 text-center">
      <div className="space-y-2">
        <p className="text-[14px] font-medium text-[#202124]">{title}</p>
        <p className="text-[13px] text-[#5f6368]">{description}</p>
      </div>
    </div>
  );
}

export function VideoAppointmentRoomWorkspace({
  appointment,
  viewerRole,
  access,
  onLeave,
}: RoomProps) {
  const { data: appointmentServices = [] } = useAppointmentServices();
  const [roomData, setRoomData] = React.useState<RoomData>(EMPTY_ROOM_DATA);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [activePanel, setActivePanel] = React.useState<MeetPanel | null>(null);
  const [panelMounted, setPanelMounted] = React.useState(false);

  const appointmentId = String(appointment.appointmentId || appointment.id || "");
  const viewState = getAppointmentViewState(appointment);
  const doctorName = getAppointmentDoctorName(appointment);
  const patientName = getAppointmentPatientName(appointment);
  const appointmentDuration = getDisplayAppointmentDuration(appointment);
  const serviceLabel = getAppointmentServiceLabel(appointment, appointmentServices as any[]);
  const serviceFee = getVideoAppointmentFee(appointment, appointmentServices as any[]);
  const appointmentTitle = safeText(doctorName || appointment.roomName, "Video appointment");
  const viewerAccessLabel = safeText(viewerRole, "participant");

  const currentUserDisplayName = React.useMemo(() => {
    const role = (viewerRole || "").toLowerCase();
    if (role === "patient") return patientName || "Patient";
    if (role === "doctor" || role.includes("doctor") || role.includes("assistant") || role.includes("therapist")) {
      return doctorName || "Doctor";
    }
    return doctorName || patientName || "Participant";
  }, [viewerRole, patientName, doctorName]);

  const remoteNameFallback = React.useMemo(() => {
    const role = (viewerRole || "").toLowerCase();
    if (role === "patient") return doctorName || "Doctor";
    return patientName || "Patient";
  }, [viewerRole, doctorName, patientName]);

  const dailyRoomUserData = React.useMemo(
    () => ({
      appointmentId,
      appointmentTitle,
      viewerRole: viewerAccessLabel,
      provider: access.provider,
      doctorName: doctorName || "",
      patientName: patientName || "",
    }),
    [access.provider, appointmentId, appointmentTitle, doctorName, patientName, viewerAccessLabel]
  );



  React.useEffect(() => {
    if (activePanel) {
      setPanelMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setPanelMounted(false);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [activePanel]);

  const refreshRoomData = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await loadRoomData(appointmentId);
      setRoomData(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load room data.");
      setRoomData(EMPTY_ROOM_DATA);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);



  React.useEffect(() => {
    void refreshRoomData();
    const interval = window.setInterval(() => {
      void refreshRoomData();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshRoomData]);

  const panelTitle = React.useMemo(() => {
    switch (activePanel) {
      case "people":
        return "People";
      case "chat":
      default:
        return "Chat";
    }
  }, [activePanel]);

  const presenterLabel = safeText(doctorName || appointment.roomName, "Class meeting");


  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#111315] p-0 text-white">
      <div className="relative z-10 flex h-full w-full flex-col gap-0 overflow-hidden">
        {loadError && (
          <div className="px-3 pt-3">
            <div className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-100">{loadError}</div>
          </div>
        )}

        {access.provider === "daily" ? (
          <motion.div 
            layout
            className="relative flex flex-1 min-h-0 overflow-hidden"
          >
            <DailyCallSurface
              access={access}
              appointmentId={appointmentId}
              appointmentTitle={appointmentTitle}
              activePanel={activePanel}
              viewerRole={viewerAccessLabel}
              onLeave={onLeave}
              displayName={currentUserDisplayName}
              remoteNameFallback={remoteNameFallback}
              userData={dailyRoomUserData}
              onOpenPanel={setActivePanel}
            />
          </motion.div>
        ) : (
          <div className="flex min-h-[calc(100dvh-1.5rem)] flex-col gap-4 bg-[#f8f9fa] p-4 text-[#202124]">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 shadow-sm border border-[#e8eaed]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a73e8] text-white text-sm font-semibold">
                  {presenterLabel
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase() || "M"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#202124]">{presenterLabel} is presenting</p>
                  <p className="truncate text-xs text-[#5f6368]">
                    {safeText(patientName, "Participant")} - {safeText(viewerRole, "participant")} access
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-[#e8eaed] bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#5f6368] shadow-sm">
                  {formatProviderLabel(access.provider)}
                </Badge>
                <Badge
                  variant={viewState.paymentCompleted ? "default" : "secondary"}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] shadow-sm",
                    viewState.paymentCompleted ? "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]" : "bg-white text-[#5f6368] border-[#e8eaed]"
                  )}
                >
                  {viewState.displayStatusLabel}
                </Badge>
                {onLeave && (
                  <Button
                    variant="outline"
                    onClick={onLeave}
                    className="gap-2 rounded-full border-[#e8eaed] bg-white text-[#202124] hover:bg-[#f8f9fa]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Leave room
                  </Button>
                )}
              </div>
            </div>

            <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
              <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-[#e8eaed] bg-white p-6 text-center shadow-sm">
                <div className="space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <PlayCircle className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold">Backend video API room</p>
                    <p className="text-sm text-[#5f6368]">
                      {access.meetingUrl ? "Meeting link available from the backend." : "Waiting for the backend to generate a meeting link."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="outline" className="border-[#e8eaed] bg-[#f8f9fa] text-[#5f6368]">
                      {safeText(access.roomName, "Room pending")}
                    </Badge>
                    {access.meetingUrl && (
                      <Button
                        variant="secondary"
                        className="bg-white text-slate-950 hover:bg-white/90"
                        onClick={() => window.open(access.meetingUrl, "_blank", "noopener,noreferrer")}
                      >
                        Open meeting link
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Card className="border-[#e8eaed] bg-white text-[#202124] shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[#202124]">
                      <Shield className="h-4 w-4 text-[#1a73e8]" />
                      Session status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-[#202124]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#5f6368]">Provider</span>
                      <span className="font-semibold text-[#202124]">{formatProviderLabel(access.provider)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#5f6368]">Duration</span>
                      <span className="font-semibold text-[#202124]">{appointmentDuration ? `${appointmentDuration} min` : "TBD"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#5f6368]">Fee</span>
                      <span className="font-semibold text-[#202124]">
                        {serviceFee > 0 ? `₹${serviceFee.toLocaleString("en-IN")}` : "Complimentary"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#5f6368]">Status</span>
                      <span className="font-semibold text-[#202124]">{viewState.normalizedStatus}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
