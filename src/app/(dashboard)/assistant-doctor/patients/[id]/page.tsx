"use client";

import { useParams, useRouter } from "next/navigation";
import { DoctorEhrContent } from "@/app/(dashboard)/doctor/patients/[id]/_components/DoctorEhrContent";
import { ASSISTANT_ROUTES } from "@/components/assistant/assistant-routes";

// AsEhr (B5): the doctor's EHR workspace. The assistant's prescription is a draft for the doctor;
// the Bills tab is hidden for the clinical roles.
export default function AssistantDoctorPatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const patientId = String(params?.id || "").trim();

  return (
    <DoctorEhrContent
      key={patientId}
      patientId={patientId}
      backHref={ASSISTANT_ROUTES.patients}
      onPrescriptionSaved={(result) => {
        if (result.prescriptionId) router.push(ASSISTANT_ROUTES.draft(result.prescriptionId));
      }}
    />
  );
}
