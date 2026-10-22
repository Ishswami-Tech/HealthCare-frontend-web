"use client";

import { useParams } from "next/navigation";
import { AssistantDispensePrescriptionScreen } from "@/components/assistant/AssistantDispenseScreen";

// AsDispense (B4) for an approved prescription: `[id]` is the prescription id.
export default function AsDispensePrescriptionPage() {
  const params = useParams<{ id?: string }>();
  const prescriptionId = String(params?.id || "");
  return <AssistantDispensePrescriptionScreen key={prescriptionId} prescriptionId={prescriptionId} />;
}
