"use client";

import { useParams } from "next/navigation";
import { AssistantDispenseSuccessScreen } from "@/components/assistant/AssistantDispenseSuccessScreen";

// AsDispenseSuccess (B4): `[id]` is the hand-over (direct dispense) id.
export default function AsDispenseSuccessPage() {
  const params = useParams<{ id?: string }>();
  const dispenseId = String(params?.id || "");
  return <AssistantDispenseSuccessScreen key={dispenseId} dispenseId={dispenseId} />;
}
