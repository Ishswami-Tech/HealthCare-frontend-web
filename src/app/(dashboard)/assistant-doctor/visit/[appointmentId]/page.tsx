"use client";

import { useParams } from "next/navigation";
import { AssistantVisitScreen } from "@/components/assistant/AssistantVisitScreen";

// AsVisitFlow (B4): visit tracker without a vitals stage (product rules V2).
export default function AsVisitFlowPage() {
  const params = useParams<{ appointmentId?: string }>();
  const appointmentId = String(params?.appointmentId || "");
  return <AssistantVisitScreen key={appointmentId} appointmentId={appointmentId} />;
}
