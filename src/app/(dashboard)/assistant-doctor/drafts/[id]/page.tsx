"use client";

import { useParams } from "next/navigation";
import { AssistantDraftPreviewScreen } from "@/components/assistant/AssistantDraftPreviewScreen";

// AsRxDraftPreview (B4).
export default function AsRxDraftPreviewPage() {
  const params = useParams<{ id?: string }>();
  const draftId = String(params?.id || "");
  return <AssistantDraftPreviewScreen key={draftId} draftId={draftId} />;
}
