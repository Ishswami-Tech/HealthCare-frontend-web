"use client";

import { useParams } from "next/navigation";
import { DoctorDraftReviewScreen } from "@/components/prescription-drafts/DoctorDraftReviewScreens";

// DocDraftReview (B4).
export default function DocDraftReviewPage() {
  const params = useParams<{ id?: string }>();
  const draftId = String(params?.id || "");
  return <DoctorDraftReviewScreen key={draftId} draftId={draftId} />;
}
