"use client";

import { useParams } from "next/navigation";
import { AssistantDraftReturnedScreen } from "@/components/assistant/AssistantDraftReturnedScreen";

// AsDraftReturned (B4).
export default function AsDraftReturnedPage() {
  const params = useParams<{ id?: string }>();
  const draftId = String(params?.id || "");
  return <AssistantDraftReturnedScreen key={draftId} draftId={draftId} />;
}
