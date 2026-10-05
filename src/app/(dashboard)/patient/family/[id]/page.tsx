"use client";

import { useParams } from "next/navigation";
import { FamilyMemberContent } from "../_components/FamilyMemberContent";

/** /patient/family/[id] — one family member of the signed-in patient. */
export default function PatientFamilyMemberPage() {
  const params = useParams<{ id?: string }>();
  const memberId = String(params?.id || "").trim();

  return <FamilyMemberContent key={memberId} memberId={memberId} />;
}
